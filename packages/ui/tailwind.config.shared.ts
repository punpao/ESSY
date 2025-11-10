import plugin from 'tailwindcss/plugin';

const tailwindShared = {
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        ':root': {
          '--background': '255 255 255',
          '--foreground': '17 24 39'
        },
        body: {
          fontFamily: 'var(--font-sans)'
        }
      });
    })
  ]
};

export default tailwindShared;
