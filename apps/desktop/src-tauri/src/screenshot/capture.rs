use image::{DynamicImage, ImageBuffer, Rgba};
use screenshots::Screen;
use rand::Rng;

/// Capture a screenshot of the primary display
pub fn capture_primary_screen() -> Result<DynamicImage, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to enumerate screens: {}", e))?;

    let primary = screens
        .into_iter()
        .find(|s| s.display_info.is_primary)
        .ok_or("No primary screen found")?;

    let capture = primary
        .capture()
        .map_err(|e| format!("Failed to capture: {}", e))?;

    let width = capture.width();
    let height = capture.height();
    // `screenshots` re-exports its own `image` crate version; copy raw bytes
    // into our `image` 0.25 buffer to avoid cross-version type mismatches.
    let rgba_data = capture.into_raw();

    let buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, rgba_data)
        .ok_or("Failed to create image buffer")?;

    Ok(DynamicImage::ImageRgba8(buffer))
}

/// Calculate a random delay (in seconds) for the screenshot "lottery": one
/// screenshot is taken at a random point within `[min_mins, max_mins)`,
/// mirroring how apps like Hubstaff/ClickUp randomize capture timing per
/// tracking interval so it can't be predicted/gamed by the person being
/// tracked, while still guaranteeing regular coverage.
pub fn random_delay_secs(min_mins: u64, max_mins: u64) -> u64 {
    let min_secs = min_mins * 60;
    let max_secs = max_mins.max(min_mins + 1) * 60;
    let mut rng = rand::rng();
    rng.random_range(min_secs..max_secs)
}
