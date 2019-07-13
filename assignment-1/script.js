// prettier-ignore
const shapes = {
    square: [
        0.05, 0.05,
        -0.05, -0.05,
        0.05, -0.05,
        0.05, 0.05,
        -0.05, -0.05,
        -0.05, 0.05
    ],
    triangle: [
        0, 0,
        0.021, -0.042,
        -0.021, -0.042
    ]
}

document.body.style.backgroundColor = "black"
const height = window.innerHeight
document.body.style.margin = 0
document.body.style.overflow = "hidden"
document.body.style.fontFamily = "monospace"
const canvas = document.createElement("canvas")
canvas.setAttribute("width", height + "")
canvas.setAttribute("height", height + "")
document.body.appendChild(canvas)
canvas.style.margin = "auto"
canvas.style.display = "block"
const gl = canvas.getContext("webgl")
if (!gl) throw new Error("WebGL not supported")
const div = document.createElement("h3")
div.style.position = "absolute"
div.style.top = "10px"
div.style.left = "10px"
div.style.color = "white"
document.body.appendChild(div)
div.innerHTML = `
controls<br>
Arrows: Move<br>
LMB: Shoot<br>
r: Restart<br>
q: Quit<br>

`

const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        new Error(
            `
            An error occurred compiling the shaders:
            ${gl.getShaderInfoLog(shader)}
            `
        )
    }

    return shader
}

const createShaderProgram = (gl, vertexShaderSource, fragmentShaderSource) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
            `
            Unable to initialize the shader program:
            ${gl.getProgramInfoLog(shaderProgram)}
            `
        )
    }

    return program
}

const createBuffer = gl => {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    return buffer
}

const initKeyPress = () => {
    window.addEventListener("keydown", event => {
        keys[event.key] = true
    })

    window.addEventListener("keyup", event => {
        keys[event.key] = false
    })
}

const initEnemies = (rows, columns) =>
    rows.map(rowPos => columns.map(colPos => new Enemy(colPos, rowPos)))

class Entity {
    constructor(x, y, shape) {
        this.shape = shape
        this.x = x
        this.y = y
    }
    get vertices() {
        const length = this.shape.length
        const vertices = new Array(length)
        for (let i = 0; i < length; i += 2) {
            vertices[i] = this.shape[i] + this.x
            vertices[i + 1] = this.shape[i + 1] + this.y
        }
        return vertices
    }
    move(x, y, delta) {
        this.x += x * delta
        this.y += y * delta
    }
    nearX(x, distance = 0.05) {
        return Math.abs(this.x - x) < distance
    }
    nearY(y, distance = 0.05) {
        return Math.abs(this.y - y) < distance
    }
}

class Player extends Entity {
    constructor() {
        super(0, -0.85, shapes.square)
    }
    move(x, y, delta) {
        this.x += x * delta
        this.y += y * delta
        if (this.x < -0.9) this.x = -0.9
        if (0.9 < this.x) this.x = 0.9
    }
}

class Bullet extends Entity {
    constructor(x, y, movingUp = -1) {
        super(x, y, shapes.triangle.map(vertex => vertex * movingUp))
        this.movingUp = movingUp
    }
    fly(delta) {
        this.y += 1 * this.movingUp * delta
    }
}

const randomNumBetween = (a, b) => Math.random() * (b - a) + a

const pi = 3.14159265359
const defineX = (a, b, x) => (x - a) / (b - a)
const cosMod = (a, b, x) => -1 * Math.cos(2 * pi * defineX(a, b, x)) + 1.1

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, shapes.square)
        this.movingRight = Math.floor(Math.random() * 2) * 2 - 1
        this.speedX = 0.1
        this.speedY = -0.05
        this.right = 0
        this.left = 0
    }
    move(delta) {
        this.y += this.speedY * delta
        this.x +=
            this.speedX *
            this.movingRight *
            delta *
            cosMod(this.right, this.left, this.x) *
            Math.abs(Math.abs(this.y - 1) + this.right - this.left)
    }
    checkBound() {
        if (this.x < this.left + 0.15) this.movingRight = 1
        if (this.right - 0.15 < this.x) this.movingRight = -1
        if (this.y < -0.95) endGame(false)
    }
    checkWin() {
        return this.nearY(-1)
    }
}

const oneIn = n => Math.floor(Math.random() * n) === 0

const moveEnemies = (enemies, delta) => {
    for (let i = 0; i < enemies.length; i++) {
        if (i === 0) enemies[i].left = -1
        else enemies[i].left = enemies[i - 1].x
        if (enemies.length - 1 <= i) enemies[i].right = 1
        else enemies[i].right = enemies[i + 1].x

        enemies[i].checkBound()

        enemies[i].move(delta)

        if (enemyIsShooting && oneIn(4)) {
            enemyShoot(enemies[i].x, enemies[i].y)
            enemyIsShooting = false
        }
    }
}

const vertexShaderSource = `
precision mediump float;
attribute vec3 aPosition;
void main() {
    gl_Position = vec4(aPosition, 1);
}
`

const fragmentShaderSource = `
precision mediump float;
uniform vec3 uColor;
void main() {
    gl_FragColor = vec4(uColor, 1);
}
`

const shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource)

const shader = {
    program: shaderProgram,
    locations: {
        aPosition: gl.getAttribLocation(shaderProgram, "aPosition"),
        uColor: gl.getUniformLocation(shaderProgram, "uColor")
    }
}

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
}
initKeyPress()

const buffer = createBuffer(gl)

gl.enableVertexAttribArray(shader.locations.aPosition)
gl.vertexAttribPointer(shader.locations.aPosition, 2, gl.FLOAT, false, 0, 0)

const collisionX = (bullet, enemies, graveYard) => {
    for (let i = 0; i < enemies.length; i++) {
        if (bullet.nearX(enemies[i].x)) {
            graveYard.push(enemies[i])
            enemies.splice(i, 1)
            return true
        }
    }
}
const collisionY = (bullets, enemies, graveYard) => {
    const rowPositions = []
    const rowIndeces = []
    enemies.forEach((row, i) => {
        if (0 < row.length) {
            rowPositions.push(row[0].y)
            rowIndeces.push(i)
        }
    })
    const nearest = rowPositions[0] - 0.075
    if (bullets[0] && (bullets[0].y < -1.2 || 1.2 < bullets[0].y)) bullets.unshift()
    for (let bIndex = 0; bIndex < bullets.length; bIndex++) {
        if (bullets[bIndex] < nearest) return false
        for (let rIndex = 0; rIndex < rowPositions.length; rIndex++) {
            if (bullets[bIndex].nearY(rowPositions[rIndex])) {
                if (collisionX(bullets[bIndex], enemies[rowIndeces[rIndex]], graveYard)) {
                    graveYard.push(bullets[bIndex])
                    bullets.splice(bIndex, 1)
                    return true
                }
            }
        }
    }
    return false
}

// use the program
gl.useProgram(shader.program)

const startingPositions = {
    x: [-0.6, -0.2, 0.2, 0.6],
    y: [0.8, 1]
}

const printEnemies = (enemies, row = "") =>
    enemies.forEach((enemy, i) =>
        console.log(
            `${row}:${i} -- left: ${enemy.left.toFixed(2)}, x: ${enemy.x.toFixed(
                2
            )}, right: ${enemy.right.toFixed(2)}`
        )
    )

const ammoPosition = [-0.5, -0.6, -0.7, -0.8, -0.9]
const ammo = ammoPosition.map(position => new Bullet(-0.9, position, 1))

const maxAmmo = 5
let currentAmmo = 5

const player = new Player()
const enemyBullets = []
const playerBullets = []
const graveYard = [...ammo]
const enemies = initEnemies(startingPositions.y, startingPositions.x)

let enemyIsShooting = false
const enemyShoot = (x, y) => enemyBullets.push(new Bullet(x, y - 0.05, -1))
setInterval(() => {
    enemyIsShooting = true
}, 500)

let ammoTimer
const playerShoot = () => playerBullets.push(new Bullet(player.x, player.y + 0.05, 1))
window.addEventListener("click", event => {
    if (0 < currentAmmo) {
        playerShoot()
        currentAmmo -= 1
        clearInterval(ammoTimer)
        ammoTimer = setInterval(() => {
            if (currentAmmo < maxAmmo) currentAmmo++
        }, 750)
    }
})
window.addEventListener("keydown", event => {
    if (event.key === "r") {
        location.reload(true)
    }
    if (event.key === "q") {
        canvas.style.display = "none"
    }
})

const draw = (gl, entities) => {
    const vertices = entities.map(bullet => bullet.vertices).flat()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length >> 1)
}

gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

const changeColor = (gl, r, g, b) => gl.uniform3f(shader.locations.uColor, r, g, b)

let gameHasEnded = false
let playerWon = false
const endGame = won => {
    gameHasEnded = true
    playerWon = won
}

const hasNoEnemies = enemies => {
    for (let i = 0; i < enemies.length; i++) {
        if (0 < enemies[i].length) return false
    }
    return true
}

let then = 0
const render = now => {
    now *= 0.001 // convert to seconds
    const delta = now - then
    then = now

    if (keys.ArrowLeft) player.move(-0.5, 0, delta)
    if (keys.ArrowRight) player.move(0.5, 0, delta)

    playerBullets.forEach(bullet => bullet.fly(delta))
    enemyBullets.forEach(bullet => bullet.fly(delta))

    enemies.forEach(rowOfEnemies => moveEnemies(rowOfEnemies, delta))

    collisionY(playerBullets, enemies, graveYard)
    if (collisionY(enemyBullets, [[player]], graveYard)) endGame(false)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)

    changeColor(gl, 0.2, 0.2, 0.2)
    draw(gl, graveYard)

    changeColor(gl, 1, 1, 1)
    draw(gl, ammo.slice(maxAmmo - currentAmmo))
    draw(gl, playerBullets)
    draw(gl, enemyBullets)

    changeColor(gl, 1, 0, 0)
    enemies.forEach(row => draw(gl, row))

    if (hasNoEnemies(enemies)) endGame(true)
    if (!gameHasEnded) {
        changeColor(gl, 0, 1, 0)
        draw(gl, [player])
        requestAnimationFrame(render)
    } else {
        if (playerWon) {
            changeColor(gl, 0, 1, 0)
            draw(gl, [player])
            alert("Winner Winner Chicken Dinner")
        } else {
            changeColor(gl, 0.2, 0.2, 0.2)
            draw(gl, [player])
            alert("GAME OVER")
        }
    }
}
requestAnimationFrame(render)
