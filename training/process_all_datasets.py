#!/usr/bin/env python3
"""
Process all dataset zips from Roboflow - extract, relabel, and merge in one go

This script:
1. Finds all zip files in input folder
2. Extracts each zip
3. Relabels to simple 2-class format (punch vs no-punch)
4. Merges everything into one dataset
5. Cleans up temp files

Usage:
    python training/process_all_datasets.py --input_folder "C:/Users/Yassine/Downloads/toTrain" --output "datasets/final_simple"
"""

import argparse
import zipfile
import shutil
from pathlib import Path
from typing import List, Set, Dict
import tempfile


# Define all possible punch class names (case insensitive)
PUNCH_NAMES = {
    'jab', 'cross', 'hook', 'uppercut', 'straight', 'punch', 'punch1', 'punch3', 'punch4',
    'jabs', 'crosses', 'hooks', 'uppercuts', 'straights', 'punches',
    'boxing_punch', 'boxing_jab', 'boxing_cross', 'boxing_hook',
    'boxing_uppercut', 'right_jab', 'left_jab', 'right_cross', 'left_cross',
    'overhand', 'elbow',  # MMA/combat related
    # New datasets
    'hook-punch', 'straight-punch', 'full extension', 'fullextension', 'pun extension', 'punextension'
}

# Define "no punch" names
NO_PUNCH_NAMES = {
    'no punch', 'no_punch', 'no-punch', 'none', 'idle',
    'rest', 'standing', 'boxer_idle', 'no action', 'no_action', 'miss',
    'orthodox stance', 'southpaw stance',
    # New datasets
    'neutral', 'stance end', 'stanceend', 'stance start', 'stancestart'
}


def read_label_file(label_path: Path) -> List[str]:
    """Read YOLO label file and return list of lines"""
    if not label_path.exists():
        return []
    with open(label_path, 'r') as f:
        return f.readlines()


def write_label_file(label_path: Path, lines: List[str]) -> None:
    """Write lines to a YOLO label file"""
    label_path.parent.mkdir(parents=True, exist_ok=True)
    with open(label_path, 'w') as f:
        f.writelines(lines)


def read_class_names(dataset_dir: Path) -> Dict[int, str]:
    """Read class names from data.yaml"""
    class_map = {}
    yaml_path = dataset_dir / "data.yaml"
    
    if not yaml_path.exists():
        return {}
    
    with open(yaml_path, 'r') as f:
        content = f.read()
    
    if 'names:' in content:
        in_names = False
        class_id = 0
        
        for line in content.split('\n'):
            if 'names:' in line:
                in_names = True
                # Check if names are on same line as 'names:'
                if '[' in line:
                    names_part = line.split('[')[1].split(']')[0]
                    names = [n.strip().strip("'\"") for n in names_part.split(',')]
                    for name in names:
                        class_map[class_id] = name
                        class_id += 1
                    in_names = False
                continue
            
            if in_names:
                name = line.strip().strip("- ").strip("'\"")
                if name and not name.startswith('#') and ':' not in name:
                    class_map[class_id] = name
                    class_id += 1
            
            # Stop at next top-level key
            if ':' in line and not line.strip().startswith('-') and not line.strip().startswith('#'):
                if 'names:' not in line.lower():
                    in_names = False
    
    return class_map


def relabel_line(line: str, class_map: Dict[int, str]) -> str:
    """
    Relabel a single YOLO label line to punch (0) or no-punch (1)
    Returns relabeled line or None if should be removed
    """
    parts = line.strip().split()
    if len(parts) < 5:
        return None
    
    try:
        old_class_id = int(parts[0])
        old_class_name = class_map.get(old_class_id, '').lower()
        
        # Determine new class
        if old_class_name in PUNCH_NAMES:
            new_class_id = 0  # punch
        elif old_class_name in NO_PUNCH_NAMES:
            new_class_id = 1  # no punch
        else:
            # Unknown class (bag, person, gloves, etc) - skip it
            return None
        
        return f"{new_class_id} {' '.join(parts[1:])}\n"
    except (ValueError, IndexError):
        return None


def relabel_dataset(dataset_dir: Path, output_dir: Path) -> None:
    """Relabel a single dataset to 2-class format"""
    print(f"  Relabeling: {dataset_dir.name}")
    
    # Read class names
    class_map = read_class_names(dataset_dir)
    if not class_map:
        print(f"  ⚠️  Warning: No class names found, skipping")
        return
    
    print(f"    Found classes: {list(class_map.values())}")
    
    # Process each split
    for split in ['train', 'val', 'valid', 'test']:
        split_input = dataset_dir / split
        split_output = output_dir / split
        
        labels_input = split_input / "labels"
        if not labels_input.exists():
            continue
        
        images_input = split_input / "images"
        labels_output = split_output / "labels"
        images_output = split_output / "images"
        
        # Process each label file
        for label_file in labels_input.glob("*.txt"):
            lines = read_label_file(label_file)
            new_lines = []
            
            for line in lines:
                relabeled = relabel_line(line, class_map)
                if relabeled:
                    new_lines.append(relabeled)
            
            # Write new labels
            write_label_file(labels_output / label_file.name, new_lines)
            
            # Copy corresponding image
            image_name = label_file.stem
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                image_path = images_input / f"{image_name}{ext}"
                if image_path.exists():
                    images_output.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(image_path, images_output / f"{image_name}{ext}")
                    break


def extract_zip(zip_path: Path, extract_to: Path) -> Path:
    """Extract zip file and return path to extracted folder"""
    extract_to.mkdir(parents=True, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    
    # Find the actual dataset folder (might be nested)
    extracted = extract_to
    # Check if there's a single subdirectory
    subdirs = [d for d in extracted.iterdir() if d.is_dir() and d.name != '__MACOSX']
    if len(subdirs) == 1:
        extracted = subdirs[0]
    
    return extracted


def merge_relabeled_datasets(datasets: List[Path], output: Path) -> None:
    """Merge multiple relabeled datasets into one"""
    print(f"\n📦 Merging {len(datasets)} datasets...")
    
    output.mkdir(parents=True, exist_ok=True)
    
    # Counters
    total_images = 0
    total_labels = 0
    
    for split in ['train', 'val', 'test']:
        images_out = output / split / "images"
        labels_out = output / split / "labels"
        images_out.mkdir(parents=True, exist_ok=True)
        labels_out.mkdir(parents=True, exist_ok=True)
        
        file_counter = 0
        
        for dataset_idx, dataset_dir in enumerate(datasets):
            split_dir = dataset_dir / split
            if not split_dir.exists():
                # Try 'valid' instead of 'val'
                if split == 'val':
                    split_dir = dataset_dir / "valid"
                if not split_dir.exists():
                    continue
            
            labels_dir = split_dir / "labels"
            images_dir = split_dir / "images"
            
            if not labels_dir.exists() or not images_dir.exists():
                continue
            
            # Copy all labels and images with unique names
            for label_file in labels_dir.glob("*.txt"):
                # Unique filename to avoid collisions
                new_name = f"ds{dataset_idx}_{label_file.name}"
                
                # Copy label
                shutil.copy2(label_file, labels_out / new_name)
                
                # Copy corresponding image
                image_name = label_file.stem
                for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                    image_path = images_dir / f"{image_name}{ext}"
                    if image_path.exists():
                        new_image_name = f"ds{dataset_idx}_{image_name}{ext}"
                        shutil.copy2(image_path, images_out / new_image_name)
                        break
                
                file_counter += 1
                total_labels += 1
        
        print(f"  {split}: {file_counter} files")
        total_images = file_counter
    
    # Create final data.yaml (use relative paths)
    yaml_content = """train: train/images
val: val/images
test: test/images

nc: 2
names: ['punch', 'no punch']
"""
    
    with open(output / "data.yaml", 'w') as f:
        f.write(yaml_content)
    
    print(f"\n✅ Merged dataset created!")
    print(f"   Total files: {total_images}")
    print(f"   Output: {output}")


def main():
    parser = argparse.ArgumentParser(description="Process all Roboflow dataset zips")
    parser.add_argument('--input_folder', required=True, help="Folder containing zip files")
    parser.add_argument('--output', required=True, help="Output folder for final merged dataset")
    
    args = parser.parse_args()
    
    input_folder = Path(args.input_folder)
    output = Path(args.output)
    
    if not input_folder.exists():
        print(f"❌ Error: Input folder not found: {input_folder}")
        return
    
    # Find all zip files
    zip_files = list(input_folder.glob("*.zip"))
    
    if not zip_files:
        print(f"❌ No zip files found in {input_folder}")
        return
    
    print(f"📂 Found {len(zip_files)} zip files")
    
    # Create temp directory for extraction
    temp_dir = Path(tempfile.mkdtemp(prefix="brawlr_"))
    relabeled_datasets = []
    
    try:
        # Process each zip
        for i, zip_path in enumerate(zip_files, 1):
            print(f"\n📦 Processing {i}/{len(zip_files)}: {zip_path.name}")
            
            # Extract
            extract_dir = temp_dir / f"extract_{i}"
            extracted = extract_zip(zip_path, extract_dir)
            
            # Relabel
            relabeled_dir = temp_dir / f"relabeled_{i}"
            relabel_dataset(extracted, relabeled_dir)
            
            # Check if relabeling actually created files
            if any((relabeled_dir / split / "labels").exists() and 
                   any((relabeled_dir / split / "labels").iterdir()) 
                   for split in ['train', 'val', 'valid', 'test']):
                relabeled_datasets.append(relabeled_dir)
                print(f"  ✅ Relabeled successfully")
            else:
                print(f"  ⚠️  No valid labels after relabeling, skipping")
        
        if not relabeled_datasets:
            print("\n❌ No datasets were successfully relabeled!")
            return
        
        # Merge all relabeled datasets
        print(f"\n🔄 Merging {len(relabeled_datasets)} datasets...")
        merge_relabeled_datasets(relabeled_datasets, output)
        
        print(f"\n🎉 Done! Your dataset is ready at: {output}")
        print(f"💡 Next step: Train with:")
        print(f"   python training/quick_train.py --data \"{output}/data.yaml\" --epochs 30 --device 0")
        
    finally:
        # Clean up temp directory
        print(f"\n🧹 Cleaning up temp files...")
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


if __name__ == "__main__":
    main()

