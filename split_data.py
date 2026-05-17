import os
import shutil
import random

data_dir = r"C:\Users\savan\Desktop\herbal\data"
train_dir = os.path.join(data_dir, "train")
val_dir = os.path.join(data_dir, "val")

classes = ["Acne", "normal", "oily"]

for cls in classes:
    os.makedirs(os.path.join(train_dir, cls.lower()), exist_ok=True)
    os.makedirs(os.path.join(val_dir, cls.lower()), exist_ok=True)
    
    src_dir = os.path.join(data_dir, cls)
    files = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]
    random.shuffle(files)
    
    split_idx = int(0.8 * len(files))
    train_files = files[:split_idx]
    val_files = files[split_idx:]
    
    for f in train_files:
        shutil.move(os.path.join(src_dir, f), os.path.join(train_dir, cls.lower(), f))
    for f in val_files:
        shutil.move(os.path.join(src_dir, f), os.path.join(val_dir, cls.lower(), f))
    
    # Remove old class dir if empty
    if not os.listdir(src_dir):
        os.rmdir(src_dir)

print("Split completed: 80% Train, 20% Val.")
