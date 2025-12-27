export interface DetailedDeviceInfo {
    osName: string;
    osVersion: string;
    browserName: string;
    browserVersion: string;
    cpuArchitecture: string;
    resolution: string;
    timeZone: string;
    language: string;
    cores: number;
    memory: number | string;
    isMobile: boolean;
  }
  
  export const getDetailedDeviceInfo = (): DetailedDeviceInfo => {
    const ua = navigator.userAgent;
    let osName = "Unknown OS";
    let osVersion = "Unknown Version";
    let browserName = "Unknown Browser";
    let browserVersion = "Unknown Version";
    
    // --- 1. OS DETECTION ---
    if (/Windows/.test(ua)) {
      osName = "Windows";
      if (/Windows NT 10.0/.test(ua)) osVersion = "10 / 11";
      else if (/Windows NT 6.3/.test(ua)) osVersion = "8.1";
      else if (/Windows NT 6.2/.test(ua)) osVersion = "8";
      else if (/Windows NT 6.1/.test(ua)) osVersion = "7";
    } else if (/Android/.test(ua)) {
      osName = "Android";
      const match = ua.match(/Android\s([0-9\.]+)/);
      if (match) osVersion = match[1];
    } else if (/iPhone|iPad|iPod/.test(ua)) {
      osName = "iOS";
      const match = ua.match(/OS\s([0-9_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (/Mac/.test(ua)) {
      osName = "MacOS";
      const match = ua.match(/Mac OS X\s([0-9_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (/Linux/.test(ua)) {
      osName = "Linux";
    }
  
    // --- 2. BROWSER DETECTION ---
    if (/Chrome/.test(ua) && !/Chromium|Edg/.test(ua)) {
      browserName = "Chrome";
      const match = ua.match(/Chrome\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    } else if (/Firefox/.test(ua)) {
      browserName = "Firefox";
      const match = ua.match(/Firefox\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      browserName = "Safari";
      const match = ua.match(/Version\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    } else if (/Edg/.test(ua)) {
      browserName = "Edge";
      const match = ua.match(/Edg\/([0-9\.]+)/);
      if (match) browserVersion = match[1];
    }
  
    // --- 3. CPU / PLATFORM ---
    let cpuArchitecture = "Unknown";
    if (navigator.platform) {
        if (navigator.platform.indexOf('Win') > -1) {
            cpuArchitecture = ua.includes('WOw64') || ua.includes('Win64') ? 'amd64' : 'x86';
        } else if (navigator.platform.indexOf('Mac') > -1) {
            cpuArchitecture = 'Apple Silicon / Intel'; // Modern Macs obfuscate this
        } else if (/Linux/.test(navigator.platform)) {
             if (ua.includes('aarch64')) cpuArchitecture = 'arm64';
             else if (ua.includes('armv7')) cpuArchitecture = 'armv7';
             else cpuArchitecture = 'x86_64';
        } else {
            cpuArchitecture = navigator.platform;
        }
    }
  
    // --- 4. HARDWARE SPECS ---
    const cores = navigator.hardwareConcurrency || 0;
    const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown';
    const resolution = `${window.screen.width}x${window.screen.height}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
    return {
      osName,
      osVersion,
      browserName,
      browserVersion,
      cpuArchitecture,
      resolution,
      timeZone,
      language: navigator.language,
      cores,
      memory,
      isMobile: /Mobi|Android/i.test(ua)
    };
  };