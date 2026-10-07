use device_query::{DeviceQuery, DeviceState, Keycode};

/// Samples keyboard/mouse deltas between ticks for activity scoring.
pub struct InputSampler {
    device: DeviceState,
    last_mouse_pos: (i32, i32),
    last_buttons: Vec<bool>,
    last_keys: Vec<Keycode>,
}

impl InputSampler {
    pub fn new() -> Self {
        let device = DeviceState::new();
        let mouse = device.get_mouse();
        let keys = device.get_keys();
        Self {
            last_mouse_pos: mouse.coords,
            last_buttons: mouse.button_pressed.clone(),
            last_keys: keys,
            device,
        }
    }

    /// Returns (new_clicks, new_key_presses) since last sample.
    pub fn sample_delta(&mut self) -> (u32, u32) {
        let mouse = self.device.get_mouse();
        let keys = self.device.get_keys();

        let mut clicks = 0u32;
        for (i, pressed) in mouse.button_pressed.iter().enumerate() {
            let was = self.last_buttons.get(i).copied().unwrap_or(false);
            if *pressed && !was {
                clicks += 1;
            }
        }

        // Count newly pressed keys (not held continuously).
        let mut key_presses = 0u32;
        for key in &keys {
            if !self.last_keys.contains(key) {
                key_presses += 1;
            }
        }

        // Small mouse movement counts as mild activity (not a click).
        let moved = mouse.coords != self.last_mouse_pos;
        if moved && clicks == 0 && key_presses == 0 {
            // leave as zero counters; movement only keeps idle detection honest via OS
        }

        self.last_mouse_pos = mouse.coords;
        self.last_buttons = mouse.button_pressed.clone();
        self.last_keys = keys;

        (clicks, key_presses)
    }
}

impl Default for InputSampler {
    fn default() -> Self {
        Self::new()
    }
}
