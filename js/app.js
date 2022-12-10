import { SceneManager } from "./manager.js";

//このアプリを管理する一番親のクラス
class App {
    constructor() {
        this.webfontLoad();
    }

    async webfontLoad() {
        //参考: https://zenn.dev/cococig/articles/1d494847985263
        //動画は https://github.com/typekit/webfontloader を使用しているが、これはpolyfillであり、現在はCSS Font Loading APIが使えるはず
        //PIXI用に https://www.npmjs.com/package/pixi-webfont-loader があるが、これも使っているAPIは同じかな？

        const fontFamilyName = "Zen Old Mincho"; // 取得したいGoogleフォント名
        const urlFamilyName = fontFamilyName.replace(/ /g, "+"); // URLでは空白を+に置き換える
        const googleApiUrl = `https://fonts.googleapis.com/css?family=${urlFamilyName}:wght@700`; // Google Fonts APIのURL

        const response = await fetch(googleApiUrl);
        const cssFontFace = await response.text();
        const matchUrls = cssFontFace.match(/url\(.+?\)/g);
        if (!matchUrls) throw new Error("フォントが見つかりませんでした");

        for (const url of matchUrls) {
            const font = new FontFace(fontFamilyName, url);
            await font.load();
            document.fonts.add(font);
        }

        this.onWebfontLoad();
    }

    onWebfontLoad() {
        new SceneManager();
    }
}

window.addEventListener("DOMContentLoaded", new App());