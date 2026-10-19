const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

// Native host views are replaced only for interaction tests; this is not device/layout emulation.
function createLoader(overrides = {}) {
  const cache = new Map();
  const alerts = [];
  const native = {
    ActivityIndicator: 'ActivityIndicator', Image: 'Image', KeyboardAvoidingView: 'KeyboardAvoidingView',
    Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', TextInput: 'TextInput', View: 'View',
    Modal: ({ visible, children, ...props }) => visible ? React.createElement('Modal', props, children) : null,
    StyleSheet: { create: (styles) => styles, hairlineWidth: 1, absoluteFillObject: {} },
    Platform: { OS: 'ios', select: (choices) => choices.ios ?? choices.default },
    Alert: { alert: (...args) => alerts.push(args) },
    Linking: { openURL: async () => undefined },
    Keyboard: { dismiss() {} },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  };
  const imports = {
    react: React,
    'react-native': native,
    'react-native-safe-area-context': {
      useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
      SafeAreaView: 'SafeAreaView', SafeAreaProvider: 'SafeAreaProvider',
    },
    ...overrides,
  };
  function load(file) {
    const absolute = path.resolve(__dirname, '..', file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', code)((id) => {
      if (Object.hasOwn(imports, id)) return imports[id];
      if (id === 'react/jsx-runtime') return require(id);
      if (/\.(gif|jpg|png)$/.test(id)) {
        const asset = path.resolve(path.dirname(absolute), id);
        if (!fs.existsSync(asset)) throw new Error(`Missing image: ${asset}`);
        return { uri: asset };
      }
      if (id.startsWith('.')) {
        const base = path.resolve(path.dirname(absolute), id);
        const resolved = ['.ts', '.tsx', '.js'].map((ext) => base + ext).find(fs.existsSync);
        if (resolved) return load(resolved);
      }
      throw new Error(`Unexpected UI dependency: ${id} in ${file}`);
    }, module, module.exports);
    return module.exports;
  }
  return { load, alerts, native };
}

module.exports = { createLoader };
