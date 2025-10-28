# import os
# from roboflow import Roboflow
# from dotenv import load_dotenv

# # Load environment variables from .env file
# load_dotenv()

# # Initialize Roboflow and download the dataset
# api_key = os.getenv("ROBOFLOW_API_KEY")
# if not api_key:
#     print("ERROR: ROBOFLOW_API_KEY not found!")
#     print("Please create a .env file with: ROBOFLOW_API_KEY=your_key_here")
#     exit(1)

# rf = Roboflow(api_key=api_key)
# project = rf.workspace("markmcquade").project("boxpunch-detector")
# #Creates folder with data.yaml 
# dataset = project.version(19).download("yolov8")
# #print location of dataset
# print("Dataset path:", dataset.location)
