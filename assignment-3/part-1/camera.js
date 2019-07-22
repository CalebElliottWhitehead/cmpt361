class Camera {
    constructor(viewUniform) {
        this.viewUniform = viewUniform
        this.viewMatrix = new Matrix()
    }
    transform(matrix) {
        this.viewMatrix = this.viewMatrix.dot(matrix)
    }
    setView(gl) {
        gl.uniformMatrix4fv(this.viewUniform, false, this.viewMatrix.out)
    }
    reset(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
        gl.clearDepth(1.0) // Clear everything
        gl.enable(gl.DEPTH_TEST) // Enable depth testing
        gl.depthFunc(gl.LEQUAL) // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
    // lookAt(position, direction) {
    //     const up = [0, 1, 0]
    // }
}

// if (!Array.isArray(eye) || eye.length != 3) {
//     throw "lookAt(): first parameter [eye] must be an a vec3"
// }

// if (!Array.isArray(at) || at.length != 3) {
//     throw "lookAt(): first parameter [at] must be an a vec3"
// }

// if (!Array.isArray(up) || up.length != 3) {
//     throw "lookAt(): first parameter [up] must be an a vec3"
// }

// if (equal(eye, at)) {
//     return mat4()
// }

// var v = normalize(subtract(at, eye)) // view direction vector
// var n = normalize(cross(v, up)) // perpendicular vector
// var u = normalize(cross(n, v)) // "new" up vector

// v = negate(v)

// var result = mat4(vec4(n, -dot(n, eye)), vec4(u, -dot(u, eye)), vec4(v, -dot(v, eye)), vec4())

// return result
