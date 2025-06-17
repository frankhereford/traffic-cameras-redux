# Liquid Glass React Component

This is a React component that creates a "liquid glass" effect, converted from a vanilla HTML/CSS/JS implementation.

## Build

To use this component, you first need to build it. Navigate to this directory in your terminal and run:

```bash
npm install
npm run build
```

This will install the necessary development dependencies and then compile the TypeScript code into JavaScript in the `dist` folder.

## Usage in a Next.js App

You can use this local component in your Next.js application using `npm link` or by specifying a local path.

### Option 1: Using `npm link`

1.  In this directory (`liquid-glass-react`), run:
    ```bash
    npm link
    ```
2.  In your Next.js project's directory, run:
    ```bash
    npm link liquid-glass-react
    ```

### Option 2: Using a Local Path

In your Next.js project's `package.json`, add the component as a dependency with a local file path. If `liquid-glass-react` is in the same parent directory as your Next.js app, it would look like this:

```json
"dependencies": {
  "liquid-glass-react": "file:../liquid-glass-react",
  // ... other dependencies
}
```

Then, run `npm install` in your Next.js project.

### Example Component Usage

Here is an example of how you can use the `LiquidGlass` component in a Next.js page, complete with controls to modify its appearance, similar to the original demo.

```jsx
// pages/index.js
import { useState } from 'react';
import LiquidGlass from 'liquid-glass-react';
import 'liquid-glass-react/dist/LiquidGlass.module.css'; // You might need to adjust the path based on your setup

export default function HomePage() {
  const [tintColor, setTintColor] = useState('#ffffff');
  const [tintOpacity, setTintOpacity] = useState(0.4);
  const [frostBlur, setFrostBlur] = useState(2);
  const [noiseFrequency, setNoiseFrequency] = useState(0.008);
  const [distortionStrength, setDistortionStrength] = useState(77);
  const [shadowBlur, setShadowBlur] = useState(20);
  const [shadowSpread, setShadowSpread] = useState(-5);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfDB8fGVufDB8fHx8fA%3D%3D') center/cover no-repeat" 
    }}>
      <LiquidGlass
        tintColor={tintColor}
        tintOpacity={tintOpacity}
        frostBlur={frostBlur}
        noiseFrequency={noiseFrequency}
        distortionStrength={distortionStrength}
        shadowBlur={shadowBlur}
        shadowSpread={shadowSpread}
      />

      {/* Example Controls */}
      <div style={{ position: 'fixed', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 10, borderRadius: 8 }}>
        <h2>Controls</h2>
        <label>Tint Color: <input type="color" value={tintColor} onChange={e => setTintColor(e.target.value)} /></label><br/>
        <label>Tint Opacity: <input type="range" min="0" max="1" step="0.01" value={tintOpacity} onChange={e => setTintOpacity(parseFloat(e.target.value))} /></label><br/>
        <label>Frost Blur: <input type="range" min="0" max="30" value={frostBlur} onChange={e => setFrostBlur(parseInt(e.target.value))} /></label><br/>
        <label>Noise Freq: <input type="range" min="0" max="0.02" step="0.001" value={noiseFrequency} onChange={e => setNoiseFrequency(parseFloat(e.target.value))} /></label><br/>
        <label>Distortion: <input type="range" min="0" max="200" value={distortionStrength} onChange={e => setDistortionStrength(parseInt(e.target.value))} /></label><br/>
        <label>Shadow Blur: <input type="range" min="0" max="50" value={shadowBlur} onChange={e => setShadowBlur(parseInt(e.target.value))} /></label><br/>
        <label>Shadow Spread: <input type="range" min="-20" max="20" value={shadowSpread} onChange={e => setShadowSpread(parseInt(e.target.value))} /></label><br/>
      </div>
    </div>
  );
}
```

Note: In the example above, I've left out the CSS for the controls panel for brevity, but you can style it as you see fit.
The `LiquidGlass` component is draggable by default. 