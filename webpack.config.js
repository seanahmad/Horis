/**
 * This file tells webpack to compile all Typescript and SCSS
 * files into files that the browser can read.
 */

const MinifyCSSPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;

// Common loaders for CSS and SCSS files.
const cssLoaders = [
  isProd ? MinifyCSSPlugin.loader : "style-loader",
  {
    loader: "css-loader",
    options: {
      importLoaders: 1,
    },
  },
  {
    loader: "postcss-loader",
    options: {
      ident: "postcss",
      plugins: [require("cssnano")()],
    },
  },
];

module.exports = {
  mode: isProd ? "production" : "development",
  devtool: isDev ? "source-map" : false,

  entry: {
    main: "./assets/js/main.ts",
    index: "./assets/js/index.ts",
  },
  output: {
    path: __dirname + "/static",
    filename: "[name].bundle.js",
    publicPath: "/static/",
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: isDev,
        terserOptions: {
          ecma: 2016,
        },
      }),
    ],
  },
  plugins: [
    new MinifyCSSPlugin({
      path: __dirname + "/static",
      filename: "app.bundle.css",
      publicPath: "/static/",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(j|t)s$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-typescript"],
              plugins: ["@babel/plugin-transform-async-to-generator"],
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: cssLoaders.concat({
          loader: "sass-loader",
          options: {
            sourceMap: isDev,
          },
        }),
      },
      {
        test: /\.css$/,
        use: cssLoaders,
      },
      {
        test: /\.(png|gif|jpe?g)$/,
        loader: "url-loader",
        options: {
          limit: 8192,
        },
      },
      {
        test: /\.(woff|woff2|ttf|otf|svg|eot)$/,
        loader: "file-loader",
      },
    ],
  },
};
