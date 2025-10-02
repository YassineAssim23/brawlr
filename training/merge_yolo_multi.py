import argparse
import random
import shutil
from pathlib import Path
from typing import List, Tuple

import yaml


# ---- Constants ---------------------------------------------------------------

# Image extensions we treat as valid inputs when scanning directories
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp"}

# When we try to find the actual file for a stem, we probe in this order
# (keeps original behavior including uppercase variants).
PROBE_EXTS = [".jpg", ".png", ".jpeg", ".bmp", ".JPG", ".PNG", ".JPEG"]


# ---- Small Utilities ---------------------------------------------------------

def read_names_from_yaml(yaml_path: Path) -> List[str]:
    """
    Read `names` from a YOLO-style data.yaml file.
    Supports both:
      names: [class0, class1, ...]
    and
      names:
        0: class0
        1: class1
        ...
    """
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    names = data.get("names", [])
    if isinstance(names, dict):
        # Ensure order by numeric key
        names = [names[k] for k in sorted(names.keys(), key=int)]
    return [str(n) for n in names]


def ensure_out_split_dirs(out_root: Path, split: str) -> Tuple[Path, Path]:
    """
    Make sure output split folders (images/labels) exist.
    Returns (out_images_dir, out_labels_dir).
    """
    out_images = out_root / split / "images"
    out_labels = out_root / split / "labels"
    out_images.mkdir(parents=True, exist_ok=True)
    out_labels.mkdir(parents=True, exist_ok=True)
    return out_images, out_labels


def find_image_with_any_extension(base_dir: Path, stem: str) -> Path:
    """
    Given a directory and filename stem, return the first existing image path
    by probing common extensions. If none found, returns a non-existing Path.
    """
    for ext in PROBE_EXTS:
        candidate = base_dir / f"{stem}{ext}"
        if candidate.exists():
            return candidate
    return base_dir / f"{stem}.jpg"  # a non-existing path if nothing matched


# ---- Core Copy Helpers -------------------------------------------------------

def copy_split(src_root: Path, out_root: Path, split: str, prefix: str) -> int:
    """
    Copy a dataset split folder (train/val/test/valid) from src to out.
    Images are renamed with a prefix to avoid collisions (e.g., d1_XXXX.jpg).
    If a corresponding label is missing, an empty label file is written
    (this preserves negatives).
    """
    src_images = src_root / split / "images"
    src_labels = src_root / split / "labels"

    if not src_images.exists():
        return 0

    out_images, out_labels = ensure_out_split_dirs(out_root, split)

    copied = 0
    for img_path in src_images.glob("*.*"):
        if img_path.suffix.lower() not in IMAGE_EXTS:
            continue

        stem = img_path.stem
        lbl_path = src_labels / f"{stem}.txt"

        # Prefix output names to avoid filename collisions
        new_img = out_images / f"{prefix}_{img_path.name}"
        new_lbl = out_labels / f"{prefix}_{stem}.txt"

        shutil.copy2(img_path, new_img)
        if lbl_path.exists():
            shutil.copy2(lbl_path, new_lbl)
        else:
            new_lbl.write_text("")  # preserve negatives with empty label

        copied += 1

    return copied


def split_train_if_needed(
    src_root: Path,
    out_root: Path,
    prefix: str,
    val_pct: float = 0.10
) -> Tuple[int, int]:
    """
    If a dataset only has 'train', create a 'val' split by randomly moving a
    portion of the images into val (labels move alongside).
    Returns (train_count, val_count) copied out.
    """
    train_images_dir = src_root / "train" / "images"
    if not train_images_dir.exists():
        return 0, 0

    # Gather candidate stems from existing train images
    train_imgs = list(train_images_dir.glob("*.*"))
    if not train_imgs:
        return 0, 0

    stems = [
        p.stem for p in train_imgs
        if p.suffix.lower() in IMAGE_EXTS
    ]
    if not stems:
        return 0, 0

    # Deterministic shuffle (seed fixed)
    random.seed(42)
    random.shuffle(stems)

    # Always produce at least 1 val image if there is any data
    n_val = max(1, int(len(stems) * val_pct))
    val_stems = set(stems[:n_val])
    train_stems = set(stems[n_val:])

    def copy_subset(subset: set, split: str) -> int:
        out_images, out_labels = ensure_out_split_dirs(out_root, split)
        cnt = 0
        for stem in subset:
            # Find the actual image file by probing common extensions
            actual_img = find_image_with_any_extension(train_images_dir, stem)
            if not actual_img.exists():
                continue

            label_src = src_root / "train" / "labels" / f"{stem}.txt"
            new_img = out_images / f"{prefix}_{actual_img.name}"
            new_lbl = out_labels / f"{prefix}_{stem}.txt"

            shutil.copy2(actual_img, new_img)
            if label_src.exists():
                shutil.copy2(label_src, new_lbl)
            else:
                new_lbl.write_text("")

            cnt += 1
        return cnt

    copied_val = copy_subset(val_stems, "val")
    copied_train = copy_subset(train_stems, "train")
    return copied_train, copied_val


# ---- Main Merge Logic --------------------------------------------------------

def merge_datasets(
    out_root: Path,
    dataset_roots: List[Path],
    val_pct_if_missing: float
) -> None:
    """
    Merge multiple YOLO datasets into a single dataset under `out_root`.
    - Class names must match (case-insensitive)
    - Files are prefixed per-source (d1_, d2_, ...)
    - If only 'train' exists in a source, a 'val' split is created automatically
    """

    # Ensure base out structure exists (train/val/test). Other splits
    # (like 'valid') will be created on demand.
    for s in ["train", "val", "test"]:
        ensure_out_split_dirs(out_root, s)

    # Use the first dataset as the class-name reference
    first_yaml = dataset_roots[0] / "data.yaml"
    base_names = read_names_from_yaml(first_yaml)

    # Process each dataset root in order
    for idx, root in enumerate(dataset_roots, start=1):
        yaml_path = root / "data.yaml"
        if not yaml_path.exists():
            raise FileNotFoundError(f"No data.yaml in {root}")

        current_names = read_names_from_yaml(yaml_path)

        # Strict but case-insensitive class-name check
        if [n.lower() for n in current_names] != [n.lower() for n in base_names]:
            raise RuntimeError(
                f"Class mismatch in {root}\n{current_names}\n!=\n{base_names}"
            )

        prefix = f"d{idx}"
        copied = 0

        # Copy splits that exist.
        # NOTE: Original behavior leaves 'valid' copied into an output 'valid' split.
        # (Even though the comment said "put 'valid' into 'val'", the actual code
        # copies into 'valid'. We keep that behavior unchanged.)
        for split in ["train", "val", "valid", "test"]:
            copied += copy_split(root, out_root, split, prefix)

        # If neither 'val' nor 'valid' existed, create 'val' by sampling from 'train'
        if not (root / "val").exists() and not (root / "valid").exists():
            t_count, v_count = split_train_if_needed(
                root, out_root, prefix, val_pct_if_missing
            )
            copied += t_count + v_count

        print(f"[{root}] → copied {copied} images with prefix {prefix}")

    # Write the final merged data.yaml in the output root
    data_yaml = {
        "path": str(out_root),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(base_names),
        "names": base_names,
    }
    with open(out_root / "data.yaml", "w", encoding="utf-8") as f:
        yaml.safe_dump(data_yaml, f, sort_keys=False)

    print(f"\nDone. Merged dataset at: {out_root}")
    print(f"Classes: {base_names}")


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Merge YOLO-format datasets.")
    parser.add_argument(
        "--out",
        required=True,
        help="Output merged dataset root directory"
    )
    parser.add_argument(
        "--datasets",
        nargs="+",
        required=True,
        help="List of YOLO dataset roots (each contains a data.yaml)"
    )
    parser.add_argument(
        "--val_pct_if_missing",
        type=float,
        default=0.10,
        help="Val split ratio if a dataset only has train/"
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    out_root = Path(args.out)
    dataset_roots = [Path(p) for p in args.datasets]

    merge_datasets(
        out_root=out_root,
        dataset_roots=dataset_roots,
        val_pct_if_missing=args.val_pct_if_missing,
    )


if __name__ == "__main__":
    main()