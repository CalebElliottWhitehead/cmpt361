const getCubeLines = () => {
    // prettier-ignore
    const front = [
    [-1.0, -1.0,  1.0],
    [ 1.0, -1.0,  1.0],
    [ 1.0,  1.0,  1.0],
    [-1.0,  1.0,  1.0],
]
    // prettier-ignore
    const back = [
    [-1.0, -1.0, -1.0],
    [ 1.0, -1.0, -1.0],
    [ 1.0,  1.0, -1.0],
    [-1.0,  1.0, -1.0]
]

    const cube = []

    for (let i = 0; i < 4; i++) {
        cube.push(front[i], back[i])
        cube.push(front[i], front[(i + 1) % 4])
        cube.push(back[i], back[(i + 1) % 4])
    }

    return cube
}
