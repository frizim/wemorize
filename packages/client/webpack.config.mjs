import path from "node:path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";

const config = {
    entry: './src/index.ts',
    mode: "production",
    output: {
        filename: 'js/base.js',
        clean: true,
        path: path.resolve("./target")
    },
    module: {
        rules: [
            {
                test: /\.ts$/i,
                use: "ts-loader"
            },
            {
                test: /\.(woff2|ttf|eot)$/i,
                type: "asset",
                generator: {
                    filename: "fonts/[name][ext]"
                }
            },
            {
                test: /\.scss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {
                                verbose: true
                            }
                        }
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    "autoprefixer",
                                    "postcss-import"
                                ]
                            }
                        }
                    }
                ],
                include: [
                    path.resolve("./src/scss/base.scss")
                ],
                sideEffects: true
            },
            {
                test: /\.(svg|png|jpg)$/,
                type: "asset/resource",
                generator: {
                    filename: "img/[name][ext]"
                }
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    optimization: {
        minimizer: [
            new CssMinimizerPlugin()
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "css/base.css"
        })
    ],
    performance: {
        maxAssetSize: 1000000
    }
};

export default config;