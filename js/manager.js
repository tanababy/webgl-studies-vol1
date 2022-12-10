import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/6.5.4/browser/pixi.min.mjs';
// import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.0.4/pixi.min.mjs';
//PIXIの処理を管理するクラス
import { Particle } from "./particle.js";

//https://api.pixijs.io/@pixi/canvas-extract/PIXI/CanvasExtract.html

export class SceneManager {
    constructor() {
        this.texture = PIXI.Texture.from("../img/particle.png");
        this.particlePoints = [];
        this.particles = [];
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
        // this.pixiParent = new PIXI.Container();
        // const graphics = new PIXI.Graphics();
        // graphics.beginFill(0xFFFFFF);
        // graphics.drawRect(0, 0, window.innerWidth, window.innerHeight);
        // this.pixiParent.addChild(graphics);
        
        // this.text = new PIXI.Text("あ", {
        //     fontFamily : 'Zen Old Mincho',
        //     fontSize: 350,
        //     fill: 0x000000,
        //     align: "center"
        // });
        // // this.text.visible = false;
        // this.text.anchor.set(0.5, 0.5);
        // this.text.x = window.innerWidth / 2;
        // this.text.y = window.innerHeight / 2;

        // this.pixiParent.addChild(this.text);
        // this.stage.addChild(this.pixiParent);

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.stageWidth;
        this.canvas.height = this.stageHeight;
        this.canvas.style.position = "absolute";
        this.canvas.style.left = 0;
        this.canvas.style.top = 0;
        // document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        const myText = "か";
        const fontWidth = 350;
        const fontSize = 400;
        const fontName = "Zen Old Mincho";
    
        this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
        this.ctx.font = `${fontWidth} ${fontSize}px ${fontName}`;
        this.ctx.fillStyle = `rgba(0,0,0,0.1)`;
        this.ctx.textBaseline = `top`;
        // テキストのベースライン設定
        const fontPos = this.ctx.measureText(myText);
        //テキストの情報をオブジェクトで返してくれる
        //width : 文字列の幅 ,
        //actualBoundingBoxLeft : baselineから左枠までの距離
        //actualBoundingBoxRight  : baselineから右枠までの距離
        //actualBoundingBoxAscent : baselineから上枠までの距離
        //actualBoundingBoxDescent  : baselineから下枠までの距離
        this.ctx.fillText(
          myText,
          (this.stageWidth - fontPos.width) / 2,
          (this.stageHeight -
            (fontPos.actualBoundingBoxAscent + fontPos.actualBoundingBoxDescent)) /
            2 +
            fontPos.actualBoundingBoxAscent
        ); //テキストの描画位置を指定。1,2引数が0,0なら左上となる。
    }

    getTextDotPos() {
        const imageData = this.ctx.getImageData(0, 0, this.stageWidth, this.stageHeight).data;

        let i = 0;
        let width = 0;
        let pixel;
        const density = 2;
    
        for (let height = 0; height < this.stageHeight; height += density) {
          ++i;
          // const slide = i % 2 === 0;
          width = 0;
    
          // if (slide === false) {
          //   width += 6;
          // }
    
          for (width; width < this.stageWidth; width += density) {
            pixel = imageData[(width + height * this.stageWidth) * 4 - 1];
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
                if(color.a > threshold) {
                    gl_FragColor = vec4(mcolor, 1.0);
                } else {
                    gl_FragColor = vec4(vec3(0.0), 0.0);
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