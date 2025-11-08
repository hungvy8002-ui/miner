let game_W = 20;
let game_H = 20;
let XXX = 0, YYY = 0, Xh = 0, Yh = 0;
let MaxLeng = 0;
let speedReturn = 0;
let R = 0, r = 0;
let drag = false;
let d = false;
let ok = false;
let angle = 90;
let ChAngle = -1;
index = -1;
level = -1;
time = 60;
tager = 0;
timeH = 0;
vlH = 0;
var bg = new Image();
bg.src = "images/background.png";
var hook = new Image();
hook.src = "images/hook.png";
var targetIM = new Image();
targetIM.src = "images/target.png";
var dolarIM = new Image();
dolarIM.src = "images/dolar.png";
var levelIM = new Image();
levelIM.src = "images/level.png";
var clockIM = new Image();
clockIM.src = "images/clock.png";

let N = -10;

class game {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.score = 0;

        // 👉 Thêm quản lý NPC
        this.npcs = [];
        this.npcSpawnCooldown = 0;

        this.init();
    }

    init() {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.render();
        this.newGold();
        this.initGold();
        this.loop();
        this.listenKeyboard();
        this.listenMouse();
    }

    newGold() {
        ok = false;
        index = -1;
        Xh = XXX;
        Yh = YYY;
        r = R;
        drag = false;
        timeH = -1;
        vlH = 0;
        time = 60;
        level++;
        tager = (level + 1) * 1000 + level * level * 120;
        this.initGold();
    }

    listenKeyboard() {
        document.addEventListener("keydown", () => this.solve());
    }

    listenMouse() {
        document.addEventListener("mousedown", () => this.solve());
    }

    solve() {
        if (!drag) {
            drag = true;
            d = true;
            speedReturn = this.getWidth() / 2;
            index = -1;
        }
    }

    loop() {
        this.update();
        this.draw();
        if (time > 0 || this.score > tager)
            setTimeout(() => this.loop(), 10);
        if (time <= 0 || this.checkWin()) {
            if (this.score >= tager || this.checkWin())
                this.newGold();
            else {
                window.alert("Linh đã bị egg bán với giá five đong do phế vật!\nYour Score: " + this.score);
                location.reload();
            }
        }
    }

    update() {
        this.render();
        time -= 0.01;
        Xh = XXX + r * Math.cos(this.toRadian(angle));
        Yh = YYY + r * Math.sin(this.toRadian(angle));

        // 🔹 Spawn và cập nhật NPC
        this.spawnNPC();
        for (let npc of this.npcs) npc.update();

        if (!drag) {
            angle += ChAngle;
            if (angle >= 165 || angle <= 15) ChAngle = -ChAngle;
        } else {
            if (r < MaxLeng && d && !ok) r += this.getWidth() / 5;
            else {
                d = false;
                r -= speedReturn / 2.5;
            }

            if (r < R) {
                r = R;
                drag = false;
                ok = false;
                index = -1;
                for (let i = 0; i < this.gg.length; i++) {
                    let obj = this.gg[i];
                    if (obj && obj.alive && this.range(Xh, Yh, obj.x, obj.y) <= 2 * this.getWidth()) {

                        // 💥 Nếu là bom thì nổ, không cộng/trừ điểm
                        if (typeof Bomb !== 'undefined' && obj instanceof Bomb) {
                            obj.explode(this.gg);
                            // giữ móc đứng yên 1 khung (để thấy hiệu ứng)
                            d = false;
                            ok = false;
                            index = -1;
                            timeH = time - 0.7;
                            vlH = 0;
                            continue;
                        }

                        // 💰 Nếu là vật phẩm thường → cộng điểm
                        obj.alive = false;
                        if (obj instanceof NPC) {
                            obj.caught();
                            this.score += obj.score;
                        } else {
                            this.score += obj.score;
                        }
                        timeH = time - 0.7;
                        vlH = obj.score;
                    }
                }
            }
        }

        if (drag && index == -1) {
            for (let i = 0; i < this.gg.length; i++) {
                let obj = this.gg[i];
                if (obj && obj.alive && this.range(Xh, Yh, obj.x, obj.y) <= obj.size()) {
                    ok = true;
                    index = i;
                    break;
                }
            }
        }

        if (index != -1) {
            if (this.gg[index]) {
                this.gg[index].x = Xh;
                // Một số object (bomb) có thể không có height — an toàn khi dùng (this.gg[index].height || 0)
                this.gg[index].y = Yh + (this.gg[index].height ? this.gg[index].height / 3 : 0);
                speedReturn = this.gg[index].speed || speedReturn;
            }
        }
    }

    spawnNPC() {
        // 🔹 chỉ cho tối đa 3 NPC cùng tồn tại
        this.npcs = this.npcs.filter(npc => npc.alive);
        if (this.npcs.length < 3 && Math.random() < 0.02) {
            const npc = new NPC(this);
            this.npcs.push(npc);
            this.gg.push(npc);
        }
    }

    render() {
        if (game_W != document.documentElement.clientWidth || game_H != document.documentElement.clientHeight) {
            this.canvas.width = document.documentElement.clientWidth;
            this.canvas.height = document.documentElement.clientHeight;
            game_W = this.canvas.width;
            game_H = this.canvas.height;
            XXX = game_W / 2;
            YYY = game_H * 0.18;
            R = this.getWidth() * 2;
            if (!drag) r = R;
            MaxLeng = this.range(XXX, YYY, game_W - 2 * this.getWidth(), game_H - 2 * this.getWidth());
            if (N < 0) N = game_W * game_H / (20 * this.getWidth() * this.getWidth());
        }
    }

    draw() {
        this.clearScreen();

        // vẽ mọi vật trong this.gg (dùng length để bao gồm NPC/bomb/...)
        for (let i = 0; i < this.gg.length; i++) {
            if (this.gg[i] && this.gg[i].alive) {
                if (typeof this.gg[i].update === 'function') this.gg[i].update();
                if (typeof this.gg[i].draw === 'function') this.gg[i].draw();
            }
        }

        // 🔹 vẽ NPC (nếu muốn chồng lên hoặc riêng biệt)
        for (let npc of this.npcs) npc.draw();

        this.context.beginPath();
        this.context.strokeStyle = "#000000";
        this.context.lineWidth = Math.floor(this.getWidth() / 10);
        this.context.moveTo(XXX, YYY);
        this.context.lineTo(Xh, Yh);
        this.context.stroke();

        this.context.beginPath();
        this.context.arc(XXX, YYY, 3, 0, 2 * Math.PI);
        this.context.stroke();

        this.context.save();
        this.context.translate(Xh, Yh);
        this.context.rotate(this.toRadian(angle - 90));
        this.context.drawImage(hook, -this.getWidth() / 4, -this.getWidth() / 8, this.getWidth() / 2, this.getWidth() / 2);
        this.context.restore();

        this.drawText();
    }

    drawText() {
        this.context.drawImage(dolarIM, this.getWidth() / 2, this.getWidth() / 2, this.getWidth(), this.getWidth());
        this.context.fillStyle = this.score > tager ? "#FF6600" : "red";
        this.context.font = this.getWidth() + 'px Stencil';
        this.context.fillText(this.score, this.getWidth() * 1.5, this.getWidth() * 1.35);

        this.context.drawImage(targetIM, this.getWidth() / 2, this.getWidth() * 1.5, this.getWidth(), this.getWidth());
        this.context.fillStyle = "#FF6600";
        this.context.fillText(tager, this.getWidth() * 1.5, this.getWidth() * 2.35);

        this.context.drawImage(levelIM, game_W - 3 * this.getWidth(), this.getWidth() / 2, this.getWidth(), this.getWidth());
        this.context.fillStyle = "#FFFFCC";
        this.context.fillText(level + 1, game_W - 2 * this.getWidth(), this.getWidth() * 1.35);

        this.context.drawImage(clockIM, game_W - 3 * this.getWidth(), this.getWidth() * 1.5, this.getWidth(), this.getWidth());
        this.context.fillStyle = "#FF00FF";
        this.context.fillText(Math.floor(time), game_W - 2 * this.getWidth(), this.getWidth() * 2.35);

        if (Math.abs(timeH - time) <= 0.7) {
            this.context.fillStyle = "red";
            this.context.fillText("+" + vlH, XXX, YYY * 0.8);
        }
    }

    clearScreen() {
        this.context.clearRect(0, 0, game_W, game_H);
        this.context.drawImage(bg, (bg.width - game_W * (bg.height / game_H)) / 2, 0, game_W * (bg.height / game_H), bg.height, 0, 0, game_W, game_H);
    }

    checkWin() {
        // sửa: kiểm tra toàn bộ this.gg, nếu còn object alive => chưa win
        for (let i = 0; i < this.gg.length; i++) {
            if (this.gg[i] && this.gg[i].alive) return false;
        }
        return true;
    }

    initGold() {
        this.gg = [];
        for (let i = 0; i < N; i++) this.gg[i] = new gold(this);

        // === Kiểm tra trùng cho vàng/đá ===
        while (true) {
            let check = true;
            for (let i = 0; i < N - 1; i++) {
                for (let j = i + 1; j < N; j++) {
                    while (this.range(this.gg[i].x, this.gg[i].y, this.gg[j].x, this.gg[j].y) < 2 * this.getWidth()) {
                        check = false;
                        this.gg[j].randomXY();
                    }
                }
            }
            if (check) break;
        }

        // === Thêm tối đa 2 quả bom mỗi màn, tránh trùng vị trí ===
        let numBombs = Math.min(2, Math.max(1, Math.floor(N * 0.02)));
        numBombs = Math.min(numBombs, N);

        for (let b = 0; b < numBombs; b++) {
            let bomb = new Bomb(this);

            // Lặp lại cho đến khi bom không trùng với vật khác
            let retry = 0;
            while (retry < 200) {
                let overlap = false;
                for (let i = 0; i < this.gg.length; i++) {
                    let o = this.gg[i];
                    if (!o || !o.alive) continue;
                    let dx = bomb.x - o.x;
                    let dy = bomb.y - o.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    // tránh trùng: khoảng cách phải lớn hơn bán kính bom + bán kính vật
                    if (dist < (bomb.radius / 2) + (o.size ? o.size() : 0)) {
                        overlap = true;
                        break;
                    }
                }
                if (!overlap) break;
                bomb.randomXY();
                retry++;
            }

            this.gg.push(bomb);
        }
    }

    getWidth() {
        var area = document.documentElement.clientWidth * document.documentElement.clientHeight;
        return Math.sqrt(area / 300);
    }

    toRadian(angle) {
        return (angle / 180) * Math.PI;
    }

    range(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }
}

// 🔹 Thêm class NPC
class NPC {
    constructor(game) {
        this.game = game;
        this.width = 60 + Math.random() * 20;
        this.height = 80 + Math.random() * 20;
        this.alive = true;

        this.direction = Math.random() < 0.5 ? 1 : -1;
        this.x = this.direction === 1 ? -this.width : game_W;
        const halfHeight = game_H / 2;
        this.y = halfHeight + Math.random() * (halfHeight - this.height - 20) + 20;

        this.speed = 5;
        this.score = 54;

        this.image = new Image();
        this.image.src = "images/npc.png";

        this.caughtImage = new Image();
        this.caughtImage.src = "images/npc_caught.png";

        this.isCaught = false;
        this.moveSpeed = 1.5 + Math.random() * 1.5;
    }

    update() {
        if (!this.alive) return;
        if (!this.isCaught) {
            this.x += this.moveSpeed * this.direction;
            if (this.x + this.width > game_W || this.x < 0) this.direction *= -1;
        }
        if (this.x < -this.width * 2 || this.x > game_W + this.width * 2) {
            this.alive = false;
        }
    }

    draw() {
        if (!this.alive) return;
        const img = this.isCaught ? this.caughtImage : this.image;
        this.game.context.drawImage(img, this.x, this.y, this.width, this.height);
    }

    size() {
        return this.width / 2;
    }

    caught() {
        if (this.isCaught) return;
        this.isCaught = true;
        this.image = this.caughtImage;
        this.speed = 5;
    }
}

new game();
