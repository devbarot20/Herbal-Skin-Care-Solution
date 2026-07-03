import json
import os

path = 'backend/data/products.json'
with open(path, 'r') as f:
    data = json.load(f)

for category in data:
    for product in data[category]:
        product['image_url'] = f'/images/{category}.png'
        product['gallery'] = [f'/images/{category}.png']

with open(path, 'w') as f:
    json.dump(data, f, indent=4)

print("Updated products.json successfully!")
