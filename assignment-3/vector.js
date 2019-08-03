const vector = {
    multiply: (vec1, vec2) => vec1.reduce((acc, cur, i) => acc + cur * vec2[i], 0),
    mix: (vecX, vecY, num) => vecX.map((x, indexY) => x * (1 - num) + vecY[indexY] * num),
    cross: (vec1, vec2) => [
        vec1[1] * vec2[2] - vec1[2] * vec2[1],
        vec1[2] * vec2[0] - vec1[0] * vec2[2],
        vec1[0] * vec2[1] - vec1[1] * vec2[0]
    ],
    combine: (vec1, vec2) => vec1.map((num, i) => vec2[i] * num),
    add: (vec, num_vec) => {
        if (Array.isArray(num_vec)) return vec.map((n, i) => n + num_vec[i])
        else return vec.map(n => n + num_vec)
    },
    subtract: (vec, num_vec) => {
        if (Array.isArray(num_vec)) return vec.map((n, i) => n - num_vec[i])
        else return vec.map(n => n - num_vec)
    },
    divide: (vec, num) => vec.map(n => n / num),
    length: vec => Math.sqrt(Math.abs(vec.reduce((acc, cur) => acc + cur * cur, 0))),
    // prettier-ignore
    normalize: vec => {
        const length = vector.length(vec)
        return vec.map(n => n / length || 0)
    },
    negate: vec => vec.map(n => -1 * n),
    string: vec => "[" + vec.map(n => n.toFixed(2)).join(", ") + "]",
    surface: {
        normals: surface => {
            const t1 = vector.subtract(surface[1], surface[0])
            const t2 = vector.subtract(surface[2], surface[0])
            return vector.normalize(vector.cross(t1, t2))
        }
    }
}
