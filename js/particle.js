import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/6.5.4/browser/pixi.min.mjs';

const FRICTION = 0.85;
const K = 0.1;

export class Particle {
    constructor(pos, texture) {
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.scale.set(0.2);
        this.sprite.tint = 0x000000;

        this.savedX = pos.x;//particleの初期座標。この値はアップデートされない
        this.savedY = pos.y;
        this.x = pos.x;
        this.y = pos.y;
        this.sprite.x = this.x;
        this.sprite.y = this.y;

        this.vx = 0;//速度
        this.vy = 0;

        this.ax = 0;//加速度
        this.ay = 0;
        this.radius = 10;
    }

    draw() {
        //加速度を計算する。加速度は動かしたい方向と考える
        //そうやって考えていいのは、
		//運動方程式はF = maであり、
		//質量(m)を1とすると、F = aだから。つまり力は加速度と同じ。

        //加速度は、特定時間(=1frame)における速度の増加率。
        //だから毎フレーム速度に足していく。
        //速度は、特定時間(=1frame)における位置の増加率。
        //だから毎フレーム位置に足していく。
        //よって、requestAnimationFrame内で
        //vx += ax;
        //px += vx;
        //することによって運動を表現できる。


        //particleの現在座標から初期位置へのベクトル。
        //だから基本的には最初にいた座標に戻ろうとしている運動になる
        
        //加速度に減衰率をかけているのはバネ運動のため。
        // https://qiita.com/FumioNonaka/items/399f7f43c84a7380bb2f
        // バネ運動の加速度は、目標値に近づくにつれ小さくなるはず

        this.ax = (this.savedX - this.x) * K;
        this.ay = (this.savedY - this.y) * K;

        this.vx += this.ax;
        this.vy += this.ay;

        this.vx *= FRICTION;//速度を減らさないと永遠に止まらないから摩擦を掛ける
        this.vy *= FRICTION;

        this.x += this.vx;//位置に速度を足す
        this.y += this.vy;

        this.sprite.x = this.x;//particleの位置を反映させる
        this.sprite.y = this.y;
    }
}