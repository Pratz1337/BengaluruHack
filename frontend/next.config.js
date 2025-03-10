module.exports = {
  async headers() {
    return [
      {
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
  output: 'standalone', // This should be at the root level
  env: {
    API_URL: process.env.API_URL, // Public environment variables
    VOICE_URL: process.env.VOICE_URL,
  },
};
