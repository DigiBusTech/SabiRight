const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processImages() {
  const iconPath = path.resolve(__dirname, '../client/public/assets/sabiright-icon.png');
  const logoPath = path.resolve(__dirname, '../client/public/assets/sabiright-logo.png');
  
  // 1. Update favicons
  fs.copyFileSync(iconPath, path.resolve(__dirname, '../client/public/favicon.png'));
  fs.copyFileSync(iconPath, path.resolve(__dirname, '../client/public/favicon.ico'));
  
  // 2. Copy brand logo and icon to mobile assets
  const mobileAssetsDir = path.resolve(__dirname, '../mobile/assets');
  fs.mkdirSync(mobileAssetsDir, { recursive: true });
  fs.copyFileSync(iconPath, path.join(mobileAssetsDir, 'sabiright-icon.png'));
  fs.copyFileSync(logoPath, path.join(mobileAssetsDir, 'sabiright-logo.png'));
  fs.copyFileSync(iconPath, path.join(mobileAssetsDir, 'icon.png'));
  fs.copyFileSync(iconPath, path.join(mobileAssetsDir, 'adaptive-icon.png'));

  // 3. Process friends_with_smartphones into hero-citizens.png
  const friendsSource = 'C:/Users/ekpou/Downloads/friends_with_smarphones_(1).jpg';
  const justiceSource = 'C:/Users/ekpou/Downloads/istockphoto-1491771681-612x612.jpg';

  if (fs.existsSync(friendsSource)) {
    const overlaySvg = Buffer.from(`
      <svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="darkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.25"/>
            <stop offset="60%" stop-color="#020617" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="blueAura" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="#1e40af" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.05"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#blueAura)"/>
        <rect width="800" height="500" fill="url(#darkGrad)"/>
        <rect x="24" y="432" width="210" height="38" rx="12" fill="#0f172a" fill-opacity="0.95" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="36" y="456" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="12" fill="#38bdf8">⚡ VERIFIED CITIZEN FIRST-AID</text>
      </svg>
    `);

    await sharp(friendsSource)
      .resize(800, 500, { fit: 'cover', position: 'top' })
      .modulate({ brightness: 1.05, saturation: 1.15 })
      .composite([{ input: overlaySvg, blend: 'over' }])
      .png()
      .toFile(path.resolve(__dirname, '../client/public/assets/hero-citizens.png'));

    fs.copyFileSync(
      path.resolve(__dirname, '../client/public/assets/hero-citizens.png'),
      path.join(mobileAssetsDir, 'hero-citizens.png')
    );

    console.log('Processed hero-citizens.png successfully');
  } else {
    console.warn('friendsSource not found at:', friendsSource);
  }

  if (fs.existsSync(justiceSource)) {
    const justiceOverlay = Buffer.from(`
      <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="35%" stop-color="#020617" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0.85"/>
          </radialGradient>
        </defs>
        <rect width="600" height="600" fill="url(#glow)"/>
        <rect x="24" y="530" width="255" height="38" rx="12" fill="#020617" fill-opacity="0.95" stroke="#eab308" stroke-width="1.5"/>
        <text x="38" y="554" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="12" fill="#facc15">⚖️ 1999 NIGERIAN CONSTITUTION</text>
      </svg>
    `);

    await sharp(justiceSource)
      .resize(600, 600, { fit: 'cover' })
      .modulate({ brightness: 0.98, saturation: 1.2 })
      .composite([{ input: justiceOverlay, blend: 'over' }])
      .png()
      .toFile(path.resolve(__dirname, '../client/public/assets/hero-justice.png'));

    fs.copyFileSync(
      path.resolve(__dirname, '../client/public/assets/hero-justice.png'),
      path.join(mobileAssetsDir, 'hero-justice.png')
    );

    console.log('Processed hero-justice.png successfully');
  } else {
    console.warn('justiceSource not found at:', justiceSource);
  }

  // Generate splash image for mobile with logo centered on #020617
  const splashSvg = Buffer.from(`
    <svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
      <rect width="1284" height="2778" fill="#020617"/>
    </svg>
  `);
  
  const resizedLogo = await sharp(logoPath)
    .resize(720, null, { fit: 'inside' })
    .toBuffer();

  await sharp(splashSvg)
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png()
    .toFile(path.join(mobileAssetsDir, 'splash.png'));

  console.log('Generated splash.png successfully');
}

processImages().catch(err => {
  console.error(err);
  process.exit(1);
});
