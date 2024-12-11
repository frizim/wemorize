import path from "node:path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";

const config = {
    entry: {
        base: "./src/index.ts",
        cards: "./src/cards.ts"
    },
    mode: "production",
    output: {
        filename: 'js/[name].js',
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
                test: /\.(woff|woff2|ttf|eot)$/i,
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
                    path.resolve("./src/scss/base.scss"),
                    path.resolve("./src/scss/admin.scss")
                ],
                sideEffects: true
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
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
            filename: "css/[name].css"
        })
    ],
    performance: {
        maxAssetSize: 2000000
    }
};

export default config;