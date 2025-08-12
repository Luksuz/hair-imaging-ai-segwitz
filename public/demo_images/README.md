# Demo Images

This folder contains sample images for quick testing of the Hair Follicle Segmentation app.

## How to Add Demo Images

1. **Supported Formats**: PNG, JPG, JPEG, BMP, TIFF
2. **File Location**: Place image files directly in this `demo_images/` folder
3. **Naming**: Use descriptive filenames (e.g., `hair_sample_1.jpg`, `follicle_test.png`)
4. **Size**: Any size supported, but images will be auto-cropped to remove black borders

## Example Structure

```
demo_images/
├── README.md
├── hair_sample_1.jpg
├── hair_sample_2.png
├── follicle_test_strong.jpg
├── follicle_test_medium.png
└── follicle_test_weak.jpg
```

## Usage

1. Start the Hair Follicle app: `streamlit run app.py`
2. Go to the "🖼️ Demo Images" tab
3. Select a demo image from the dropdown
4. Click "🚀 Process Image" to analyze

## Tips

- **High Quality**: Use clear, well-lit images for best results
- **Hair Focus**: Images should primarily contain hair follicles
- **Variety**: Include images with different hair types (strong, medium, weak) for testing
- **Resolution**: Higher resolution images provide more detailed analysis

The demo images feature allows users to quickly test the app functionality without needing to upload their own images. 