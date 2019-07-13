const getDepth = arr => (typeof arr === "number" ? 0 : getDepth(arr[0]) + 1)

const isNum = num => getDepth(num) <= 0

const isVec = vec => getDepth(vec) === 1

const isMat = mat => getDepth(mat) === 2

const stringifyMat = mat => "[" + mat.map(row => row.join(", ")).join("]\n[") + "]"

const stringifyVec = vec => "[" + vec.join(", ") + "]"

const stringify = mat => (isVec(mat) ? stringifyVec(mat) : stringifyMat(mat))

const dim = mat => (isMat(mat) ? mat[0].length : mat.length)

const vec = [5, 6]

// prettier-ignore
const mat2a = [
    [1, 2], 
    [3, 4]
]

// prettier-ignore
const mat2 = [
    [5, 6], 
    [7, 8]
]

// prettier-ignore
const mat3 = [
    [1, 2, 2], 
    [3, 4, 5], 
    [3, 3, 4]
]

// prettier-ignore
const mat4a = [
    [3, 4, 5, 6],
    [4, 4, 6, 7], 
    [5, 6, 5, 8], 
    [6, 7, 8, 1]
]

const transpose = mat => mat.map((row, rowNum) => row.map((_, colNum) => mat[colNum][rowNum]))

const vecDotVec = (aVec, bVec) => aVec.reduce((acc, cur, i) => acc + cur * bVec[i], 0)

const vecDotMat = (vec, mat) => mat.map(row => vecDotVec(row, vec))

const matDotMat = (aMat, bMat) => transpose(aMat).map(row => vecDotMat(row, bMat))

const getLength = vec => Math.sqrt(vec.reduce((acc, cur) => acc + cur * cur, 0))

const vecDiv = (vec, den) => vec.map(e => e / den)

const matDiv = (mat, den) => mat.map(row => vecDiv(row, den))

const vecNorm = vec => vecDiv(vec, getLength(vec))

const mat2Det = mat => mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0]

// prettier-ignore
const reduceDim = (mat, row0, col0) => mat
    .slice(row0, row0 + mat.length - 1)
    .map(row => row.slice(col0, col0 + row.length - 1))

// prettier-ignore
const removeRowCol = (mat, rowIndex = 0, colIndex = 0) => mat
    .filter((_, i) => i != rowIndex)
    .map(row => row.filter((_, i) => i != colIndex))

const adjSign = (rowIndex, colIndex = 0) => 1 - ((rowIndex + (colIndex % 2)) % 2) * 2

const det = mat => {
    if (dim(mat) <= 2) return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0]
    return mat[0].reduce((acc, cur, i) => acc + adjSign(i) * cur * det(removeRowCol(mat, 0, i)), 0)
}

// prettier-ignore
const adj = mat =>
    mat.map((row, rowIndex) =>
        row.map((e, colIndex) =>
            e * adjSign(rowIndex, colIndex) * det(removeRowCol(rowIndex, colIndex))
        )
    )

const inv = mat => matDiv(adj(mat), det(mat))

const identity = dim => {
    const mat = new Array(dim)
    for (let i = 0; i < dim; i++) {
        mat[i] = new Array(dim).fill(0)
        mat[i][i] = 1
    }
    return mat
}

class Matrix {
    constructor() {
        this.dim = 4
        this.m = new Array(this.dim)
        for (let i = 0; i < this.dim; i++) {
            this.m[i] = new Array(this.dim).fill(0)
            this.m[i][i] = 1
        }
    }
    scale(x, y, z) {
        if (y !== undefined) {
            this.m[0][0] * x
            this.m[1][1] * y
            this.m[2][2] * z
        } else {
            this.m[3][3] * x
        }
    }
    translate(x, y, z) {
        this.m[0][3] += x
        this.m[1][3] += y
        this.m[2][3] += z
    }
    rotate(theta, x, y, z) {}
    dot(mat) {
        this.m = matDotMat(this.m, mat.m)
        return this
    }
    set r(mat) {
        this.m = [
            [...mat[0], this.m[0][3]],
            [...mat[1], this.m[1][3]],
            [...mat[2], this.m[2][3]],
            this.m[3]
        ]
    }
    get det() {
        return det(reduceDim(this.m))
    }
    get out() {
        return new Float32Array(transpose(this.m).flat())
    }
    get string() {
        return "[" + this.m.map(row => row.join(", ")).join("]\n[") + "]"
    }
}
const matt = new Matrix()
console.log(matt.m)

console.log("+")
console.log(stringify(mat2a))
console.log("=")
console.log(stringify(vecDotMat(vec, mat2a)))
console.log(";")
console.log(stringify(matDotMat(mat2a, mat2)))
console.log(vecNorm(vec))
console.log(";")
console.log(stringify(mat4a))
console.log(";")
console.log(stringify(removeRowCol(mat4a, 1, 1)))
console.log(";")
const matrix = new Matrix()
console.log(matrix.string)
matrix.r = mat3
console.log(";")
console.log(matrix.string)

// console.log(stringify(identity(4)))
