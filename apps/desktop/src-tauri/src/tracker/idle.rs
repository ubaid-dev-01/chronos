/// Returns system-level idle time in seconds (cross-platform).
pub fn get_idle_seconds() -> u64 {
    #[cfg(windows)]
    {
        use winapi::um::sysinfoapi::GetTickCount;
        use winapi::um::winuser::{GetLastInputInfo, LASTINPUTINFO};

        unsafe {
            let mut last = LASTINPUTINFO {
                cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };
            if GetLastInputInfo(&mut last) == 0 {
                return 0;
            }
            let ticks = GetTickCount();
            ticks.wrapping_sub(last.dwTime) as u64 / 1000
        }
    }

    #[cfg(not(windows))]
    {
        0
    }
}

pub fn is_user_idle(threshold_secs: u64) -> bool {
    get_idle_seconds() >= threshold_secs
}
