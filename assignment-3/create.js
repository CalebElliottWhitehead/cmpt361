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
                [cos(theta), 0, -sin(theta), 0],
                [         0, 1,           0, 0],
                [sin(theta), 0,  cos(theta), 0],
                [         0, 0,           0, 1]
            ]),
            z: theta => new Matrix([
                [ cos(theta), sin(theta), 0, 0],
                [-sin(theta), cos(theta), 0, 0],
                [          0,          0, 1, 0],
                [          0,          0, 0, 1]
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
        canvas.width = Math.min(window.innerHeight, window.innerWidth)
        canvas.height = Math.min(window.innerHeight, window.innerWidth)
        window.document.body.appendChild(canvas)
        window.document.body.style.margin = 0
        window.document.body.style.overflow = "hidden"
        window.document.body.style.backgroundColor = "#222"
        return canvas.getContext("webgl")
    },
    shape: {
        cube: (gl, width, height) =>
            new Model(
                gl,
                [
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
                [
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
            ),
        cylinder: (gl, height = 4, topRadius = 0.5, bottomRadius = 0.5, sides = 12) => {
            const stepTheta = (2 * Math.PI) / sides
            const verticesPerCap = 9 * sides

            const vertices = []

            let index = 0

            // top cap
            let theta = 0
            while (index < verticesPerCap) {
                vertices[index] = Math.cos(theta) * topRadius
                vertices[index + 1] = height
                vertices[index + 2] = Math.sin(theta) * topRadius
                theta += stepTheta

                vertices[index + 3] = 0.0
                vertices[index + 4] = height
                vertices[index + 5] = 0.0

                vertices[index + 6] = Math.cos(theta) * topRadius
                vertices[index + 7] = height
                vertices[index + 8] = Math.sin(theta) * topRadius

                index += 9
            }

            // bottom cap
            theta = 0
            while (index < verticesPerCap + verticesPerCap) {
                vertices[index + 6] = Math.cos(theta) * bottomRadius
                vertices[index + 7] = -height
                vertices[index + 8] = Math.sin(theta) * bottomRadius
                theta += stepTheta

                vertices[index + 3] = 0.0
                vertices[index + 4] = -height
                vertices[index + 5] = 0.0

                vertices[index] = Math.cos(theta) * bottomRadius
                vertices[index + 1] = -height
                vertices[index + 2] = Math.sin(theta) * bottomRadius

                index += 9
            }

            // sides
            for (let j = 0; j < sides; j++) {
                for (let k = 0; k < 3; k++, index++) {
                    vertices[index] = vertices[0 + k + 9 * j]
                }
                for (let k = 0; k < 3; k++, index++) {
                    vertices[index] = vertices[6 + k + 9 * j]
                }
                for (let k = 0; k < 3; k++, index++) {
                    vertices[index] = vertices[verticesPerCap + k + 9 * j]
                }
                for (let k = 0; k < 3; k++, index++) {
                    vertices[index] = vertices[0 + k + 9 * j]
                }
                for (let k = 0; k < 3; k++, index++) {
                    vertices[index] = vertices[verticesPerCap + k + 9 * j]
                }
                for (let k = 0; k < 3; k++, index++) {
                    vertices[index] = vertices[verticesPerCap + 6 + k + 9 * j]
                }
            }

            const indices = []
            for (index = 0; index < vertices.length / 3; index += 3) {
                indices.push([index, index + 1, index + 2])
            }

            const normals = []
            for (index = 0; index < vertices.length; index += 9) {
                const a = [vertices[index], vertices[index + 1], vertices[index + 2]]
                const b = [vertices[index + 3], vertices[index + 4], vertices[index + 5]]
                const c = [vertices[index + 6], vertices[index + 7], vertices[index + 8]]
                const normal = vector.normalize(
                    vector.cross(vector.subtract(a, b), vector.subtract(a, c))
                )
                normals.push(normal, normal, normal)
            }
            const model = new Model(gl, vertices, indices, normals)
            model.translate(0, height, 0)
            return model
        }
    }
}
