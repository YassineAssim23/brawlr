from roboflow import Roboflow

# Initialize Roboflow and download the dataset
rf = Roboflow(api_key="58Hz4hHG68GxThRYu64a")
project = rf.workspace("markmcquade").project("boxpunch-detector")
#Creates folder with data.yaml 
dataset = project.version(19).download("yolov8")
#print location of dataset
print("Dataset path:", dataset.location)
