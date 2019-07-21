const create = {
    // prettier-ignore
    matrix: {
        identity: () => new Matrix(),
        projection: (fieldOfView, aspect, near, far) => new Matrix([
            [1 / tan(fieldOfView / 2) / aspect,                                 0,                              0,  0],
            [                                0, 1 / tan(fieldOfView / 2) / aspect,                              0,  0],
            [                                0,                                 0,   -(near + far) / (far - near), -1],
            [                                0,                                 0, -2 * near * far / (far - near),  0]
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
    }
}
