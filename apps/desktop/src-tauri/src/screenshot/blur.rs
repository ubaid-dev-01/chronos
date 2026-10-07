use image::DynamicImage;
use sha2::{Digest, Sha256};

/// Privacy blur engine — Gaussian blur on-device before upload.
pub struct BlurEngine {
    enabled: bool,
    blur_sigma: f32,
}

impl BlurEngine {
    pub fn new() -> Self {
        Self {
            enabled: true,
            blur_sigma: 8.0,
        }
    }

    pub fn blur_screenshot(&self, image: &DynamicImage) -> DynamicImage {
        if !self.enabled {
            return image.clone();
        }
        image.blur(self.blur_sigma)
    }

    pub fn generate_thumbnail(&self, image: &DynamicImage, max_width: u32) -> DynamicImage {
        image.resize(
            max_width,
            max_width,
            image::imageops::FilterType::Triangle,
        )
    }

    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }

    pub fn set_blur_level(&mut self, sigma: f32) {
        self.blur_sigma = sigma.clamp(2.0, 20.0);
    }
}

pub fn encode_png(image: &DynamicImage) -> Result<Vec<u8>, String> {
    let mut bytes: Vec<u8> = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut bytes);
    image
        .write_to(&mut cursor, image::ImageFormat::Png)
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    Ok(bytes)
}

pub fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    digest.iter().map(|b| format!("{:02x}", b)).collect()
}
