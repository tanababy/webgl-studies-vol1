import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/6.5.4/browser/pixi.min.mjs';
// import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.0.4/pixi.min.mjs';
//PIXIの処理を管理するクラス
import { Particle } from "./particle.js";

export class SceneManager {
    constructor() {
        this.texture = PIXI.Texture.from("../img/particle.png");
        this.particlePoints = [];//particleの座標を格納する
        this.particles = [];//particleのオブジェクト
        this.stageWidth = window.innerWidth;
        this.stageHeight = window.innerHeight;
        this.mouse = {
            x: 0,
            y: 0,
            radius: 50
        };

        this.init();
    }

    init() {
        this.setup();
        this.attachEvents();
        this.createText();
        this.getTextDotPos();
        this.createParticle();
        this.addFilter();
    }

    attachEvents() {
        document.addEventListener("pointermove", this.onPointerMove.bind(this), false);
    }

    setup() {
        this.app = new PIXI.Application({
            view: document.querySelector("canvas"),
            backgroundColor: 0xffffff,
            resizeTo: window,
            transparent: false,
            antialias: true,
            resolution: Math.min(2, window.devicePixelRatio),
            autoDensity: true
        });
        this.stage = this.app.stage;
        this.app.ticker.add(this.render.bind(this));
    }

    createText() {
        const canvas = document.createElement("canvas");
        canvas.width = this.stageWidth;
        canvas.height = this.stageHeight;
        canvas.style.position = "absolute";
        canvas.style.left = 0;
        canvas.style.top = 0;
        document.body.appendChild(canvas);
        this.ctx = canvas.getContext("2d");
        const myText = "か";
        const fontWidth = 350;
        const fontSize = 500;
        const fontName = "Zen Old Mincho";

        this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
        this.ctx.font = `${fontWidth} ${fontSize}px ${fontName}`;
        this.ctx.fillStyle = `rgba(0,0,0,0.1)`;
        const fontPos = this.ctx.measureText(myText);

        const y = fontPos.fontBoundingBoxAscent / 2 + fontPos.fontBoundingBoxDescent / 2;
        //なんかわからないけどこれが一番テキストのリアル高さになったっぽい?
        //ここらへん詳しい人教えて。。
        //これfont familyによって変わるなあ

        //debug only
        // this.ctx.strokeStyle = "red";
        // this.ctx.beginPath();
        // this.ctx.moveTo(0, y);
        // this.ctx.lineTo(this.stageWidth, y);
        // this.ctx.closePath();
        // this.ctx.stroke();

        this.ctx.fillText(
            myText,
            this.stageWidth / 2 - fontPos.width / 2,
            y + (this.stageHeight / 2 - (y / 2)),
        );
        //テキストの描画位置を指定。1,2引数が0,0なら左上となる。
    }

    getTextDotPos() {
        const imageData = this.ctx.getImageData(0, 0, this.stageWidth, this.stageHeight).data;

        let i = 0;
        let width = 0;
        let pixel;
        const density = 2;
    
        for (let height = 0; height < this.stageHeight; height += density) {
          ++i;
          const slide = i % 2 === 0;//横のfor捜査のスタート位置を決める。
          width = 0;
    
          if (!slide) {//別になくてもいいけど、負荷軽減のためにやっておく
            width += 6;
          }
    
          for (width; width < this.stageWidth; width += density) {
            pixel = imageData[(width + height * this.stageWidth) * 4 + 3];//alpha値を取得。imageDataはデフォルトで(0, 0, 0, 0)なので文字のところが0以外になるはず。
            if (
                pixel !== 0 &&
                width > 0 &&
                width < this.stageWidth &&
                height > 0 &&
                height < this.stageHeight
            ) {
                this.particlePoints.push({
                    x: width,
                    y: height
                });
            }
          }
        }
    }

    createParticle() {
        this.container = new PIXI.ParticleContainer(
            this.particlePoints.length,
            {
                vertices: false,
                position: true,
                rotation: false,
                scale: false,
                uvs: false,
                tint: false
            }
        );
        this.stage.addChild(this.container);
        
        for (let i = 0; i < this.particlePoints.length; i++) {
            const item = new Particle(this.particlePoints[i], this.texture);
            this.container.addChild(item.sprite);
            this.particles.push(item);
        }
    }

    addFilter() {
        const blurFilter = new PIXI.filters.BlurFilter();
        blurFilter.blur = 10;
        blurFilter.autoFit = true;

        const fragSource = `
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float threshold;
            uniform float mr;
            uniform float mg;
            uniform float mb;

            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                vec3 mcolor = vec3(mr, mg, mb);
                if(color.a > threshold) {//透明度を見る。一定の透明度以下は全て切り捨てる（＝パキッと表現）
                    gl_FragColor = vec4(mcolor, 1.0);//黒色出力
                } else {
                    discard;//なにも出力しない
                }
            }
        `;
        const uniformsData = {
            threshold: 0.5,
            mr: 0.0 / 255.0,
            mg: 0.0 / 255.0,
            mb: 0.0 / 255.0,
        }

        const thresholdFilter = new PIXI.Filter(null, fragSource, uniformsData);
        // https://api.pixijs.io/@pixi/core/PIXI/Filter.html

        this.stage.filters = [blurFilter, thresholdFilter];
        this.stage.filterArea = this.app.screen;
    }

    render() {
        for (let i = 0; i < this.particles.length; i++) {
            const item = this.particles[i];
            const dx = this.mouse.x - item.x;
            const dy = this.mouse.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = item.radius + this.mouse.radius;
      
            if (dist < minDist) {
              const angle = Math.atan2(dy, dx);
              const tx = item.x + Math.cos(angle) * minDist;
              const ty = item.y + Math.sin(angle) * minDist;
              const ax = tx - this.mouse.x;
              const ay = ty - this.mouse.y;
              item.vx -= ax;
              item.vy -= ay;
            }
      
            item.draw();
        }
    }

    onPointerMove(ev) {
        this.mouse.x = ev.clientX;
        this.mouse.y = ev.clientY;
    }
}