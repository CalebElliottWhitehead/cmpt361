const create = {
    // prettier-ignore
    matrix: {
        identity: () => new Matrix(),
        projection: (fieldOfView, aspect, near, far) => new Matrix([
            [1 / tan(fieldOfView / 2) / aspect,                                 0,                               0,  0],
            [                                0, 1 / tan(fieldOfView / 2) / aspect,                               0,  0],
            [                                0,                                 0,    -(near + far) / (far - near), -1],
            [                                0,                                 0, -2 * near * far / (far - near) ,  0]
        ]),
        translation: (x, y, z) => new Matrix([
            [1, 0, 0, 0], 
            [0, 1, 0, 0], 
            [0, 0, 1, 0], 
            [x, y, z, 1]
        ]),
        rotation: {
            x: theta => new Matrix([
                [1,           0,          0, 0],
                [0,  cos(theta), sin(theta), 0],
                [0, -sin(theta), cos(theta), 0],
                [0,           0,          0, 1]
            ]),
            y: theta => new Matrix([
                [ cos(theta), 0, sin(theta), 0],
                [          0, 1,          0, 0],
                [-sin(theta), 0, cos(theta), 0],
                [          0, 0,          0, 1]
            ]),
            z: theta => new Matrix([
                [ cos(theta), sin(theta), 0, 0],
                [-sin(theta), cos(theta), 0, 0],
                [          0,          0, 1, 0],
                [          0,          0, 1, 0]
            ]),
            axis: (theta, x, y, z) => new Matrix([
                [    cos(theta) + (1 - cos(theta)) * x * x, (1 - cos(theta)) * x * y + z * sin(theta), (1 - cos(theta)) * x * z - y * sin(theta), 0],
                [(1 - cos(theta)) * x * y - z * sin(theta),     cos(theta) + (1 - cos(theta)) * y * y, (1 - cos(theta)) * y * z + x * sin(theta), 0],
                [(1 - cos(theta)) * x * z + y * sin(theta), (1 - cos(theta)) * y * z - x * sin(theta),     cos(theta) + (1 - cos(theta)) * z * z, 0],
                [                                        0,                                         0,                                         0, 1]
            ])
        }
    },
    shader: {
        program: (gl, vertexShaderSource, fragmentShaderSource) => {
            const loadShader = (gl, type, source) => {
                const shader = gl.createShader(type)
                gl.shaderSource(shader, source)
                gl.compileShader(shader)
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    gl.deleteShader(shader)
                    new Error(
                        `An error occurred compiling the shaders:
                        ${gl.getShaderInfoLog(shader)}`
                    )
                }
                return shader
            }

            const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
            const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

            const program = gl.createProgram()
            gl.attachShader(program, vertexShader)
            gl.attachShader(program, fragmentShader)
            gl.linkProgram(program)

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(
                    `Unable to initialize the shader program:
                    ${gl.getProgramInfoLog(program)}`
                )
            }

            return program
        }
    },
    canvas: window => {
        const canvas = window.document.createElement("canvas")
        canvas.width = window.innerWidth
        canvas.height = Math.min(window.innerHeight, window.innerWidth)
        window.document.body.appendChild(canvas)
        window.document.body.style.margin = 0
        window.document.body.style.overflow = "hidden"
        window.document.body.style.backgroundColor = "#222"
        return canvas.getContext("webgl")
    },
    shape: {
        cube: (width, height) => {
            return {
                vertices: [
                    [-1.0, -1.0, 1.0],
                    [1.0, -1.0, 1.0],
                    [1.0, 1.0, 1.0],
                    [-1.0, 1.0, 1.0],
                    [-1.0, -1.0, -1.0],
                    [-1.0, 1.0, -1.0],
                    [1.0, 1.0, -1.0],
                    [1.0, -1.0, -1.0],
                    [-1.0, 1.0, -1.0],
                    [-1.0, 1.0, 1.0],
                    [1.0, 1.0, 1.0],
                    [1.0, 1.0, -1.0],
                    [-1.0, -1.0, -1.0],
                    [1.0, -1.0, -1.0],
                    [1.0, -1.0, 1.0],
                    [-1.0, -1.0, 1.0],
                    [1.0, -1.0, -1.0],
                    [1.0, 1.0, -1.0],
                    [1.0, 1.0, 1.0],
                    [1.0, -1.0, 1.0],
                    [-1.0, -1.0, -1.0],
                    [-1.0, -1.0, 1.0],
                    [-1.0, 1.0, 1.0],
                    [-1.0, 1.0, -1.0]
                ].map(vertex => [
                    vertex[0] * width * 0.5,
                    vertex[1] * height * 0.5,
                    vertex[2] * width * 0.5
                ]),
                faces: [
                    [0, 1, 2],
                    [0, 2, 3],
                    [4, 5, 6],
                    [4, 6, 7],
                    [8, 9, 10],
                    [8, 10, 11],
                    [12, 13, 14],
                    [12, 14, 15],
                    [16, 17, 18],
                    [16, 18, 19],
                    [20, 21, 22],
                    [20, 22, 23]
                ]
            }
        },
        cylinder: (rBottom = 0.5, rTop = 0.5, height = 5, numSides = 8, numSegments = 4) => {
            const vertices = []
            const normals = []
            const faces = []

            let index = 0
            const offsetY = -height / 2

            for (let j = 0; j <= numSegments; j++) {
                for (let i = 0; i <= numSides; i++) {
                    const r = rBottom + ((rTop - rBottom) * j) / numSegments
                    const y = offsetY + (height * j) / numSegments
                    const x = r * Math.cos((i / numSides) * Math.PI * 2)
                    const z = r * Math.sin((i / numSides) * Math.PI * 2)
                    vertices.push([x, y, z])
                    normals.push([x, 0, z])
                    if (i < numSides && j < numSegments) {
                        faces.push([
                            index + 1,
                            index,
                            index + numSides + 1,
                            index + numSides + 1 + 1
                        ])
                    }
                    index++
                }
            }

            // bottom cap
            vertices.push([0, offsetY, 0])
            normals.push([0, -1, 0])
            const centerIndex = index
            index++
            for (var i = 0; i <= numSides; i++) {
                const y = offsetY
                const x = rBottom * Math.cos((i / numSides) * Math.PI * 2)
                const z = rBottom * Math.sin((i / numSides) * Math.PI * 2)
                vertices.push([x, y, z])
                if (i < numSides) {
                    faces.push([index, index + 1, centerIndex])
                }
                normals.push([0, -1, 0])
                index++
            }

            // top cap
            vertices.push([0, offsetY + height, 0])
            normals.push([0, 1, 0])
            index++
            for (var i = 0; i <= numSides; i++) {
                var y = offsetY + height
                var x = rTop * Math.cos((i / numSides) * Math.PI * 2)
                var z = rTop * Math.sin((i / numSides) * Math.PI * 2)
                vertices.push([x, y, z])
                if (i < numSides) {
                    faces.push([index + 1, index, centerIndex])
                }
                normals.push([0, 1, 0])
                index++
            }

            return {
                vertices,
                faces,
                normals
            }
        },
        cylinder2: (radius = 1, height = 2, sides = 5) => {
            const points = sides * height * 6
            const step = (Math.PI * 2) / sides
            let angle = 0

            // generate points
            const positions = Array(points)
                .fill([0, 0, 0])
                .map((el, index) => {
                    const _index = index / sides

                    if (index % sides === 0) {
                        angle = 0
                    }

                    const vector = [
                        Math.sin(angle) * (radius / 2.0),
                        _index,
                        Math.cos(angle) * (radius / 2.0)
                    ]

                    angle += step

                    return vector
                })

            // connect lines with cells
            const cells = []

            for (let i = 0; i < points / 2; i += sides) {
                for (let j = 0; j < sides; j++) {
                    // if last cell in row, connect back to
                    // first side to complete tunnel.
                    if (j === sides) {
                        cells.push([j + i, sides * i, sides + j + i])
                        cells.push([sides * i, sides + j + i, 1 + j + i])
                    } else {
                        cells.push([j + i, j + i + 1, sides + j + i])
                        cells.push([j + i + 1, sides + j + i, sides + 1 + j + i])
                    }
                }
            }

            return {
                vertices: positions,
                faces: cells
            }
        }
    }
}
