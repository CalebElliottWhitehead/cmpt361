const sin = theta => Math.sin(theta)
const cos = theta => Math.cos(theta)
const tan = theta => Math.tan(theta)

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
        scale: (x,y,z) => new Matrix([
            [x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1]
        ]),
        lookAt: (position, target, up) => {
            const zAxis = vector.normalize(vector.subtract(position, target))
            const xAxis = vector.normalize(vector.cross(up, zAxis))
            const yAxis = vector.normalize(vector.cross(zAxis, xAxis))
            return new Matrix([
               [   ...xAxis, 0],
               [   ...yAxis, 0],
               [   ...zAxis, 0],
               [...position, 1]
            ])
        },
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
    // prettier-ignore
    cube: (gl, width, height) => new Model(gl, [
        [-1, -1,  1],
        [ 1, -1,  1],
        [ 1,  1,  1],
        [-1,  1,  1],
        [-1, -1, -1],
        [-1,  1, -1],
        [ 1,  1, -1],
        [ 1, -1, -1],
        [-1,  1, -1],
        [-1,  1,  1],
        [ 1,  1,  1],
        [ 1,  1, -1],
        [-1, -1, -1],
        [ 1, -1, -1],
        [ 1, -1,  1],
        [-1, -1,  1],
        [ 1, -1, -1],
        [ 1,  1, -1],
        [ 1,  1,  1],
        [ 1, -1,  1],
        [-1, -1, -1],
        [-1, -1,  1],
        [-1,  1,  1],
        [-1,  1, -1]
    ].map(vertex => [
        vertex[0] * width * 0.5,
        vertex[1] * height * 0.5,
        vertex[2] * width * 0.5
    ]), [
        [ 0,  1,  2],
        [ 0,  2,  3],
        [ 4,  5,  6],
        [ 4,  6,  7],
        [ 8,  9, 10],
        [ 8, 10, 11],
        [12, 13, 14],
        [12, 14, 15],
        [16, 17, 18],
        [16, 18, 19],
        [20, 21, 22],
        [20, 22, 23]
    ]),
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
        canvas.style.display = "block"
        window.document.body.appendChild(canvas)
        window.document.body.style.margin = 0
        window.document.body.style.overflow = "hidden"
        window.document.body.style.backgroundColor = "#222"
        return canvas.getContext("webgl")
    }
}
