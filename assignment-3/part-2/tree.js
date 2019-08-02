class Leaf extends Model {
    constructor(gl, size) {
        // prettier-ignore
        const vertices = [
            [   0,   0,   0],
            [ 0.6, 0.5, 0.3],
            [   0,   2,   0],
            [-0.6, 0.5, 0.3]
        ].map(vertex => vertex.map(n => size * n))

        // prettier-ignore
        const indices = [
            [0, 1, 2], 
            [0, 2, 3]
        ]

        super(gl, vertices, indices)

        this.color = [0.24, 0.68, 0.24, 1]
    }
}

class Branch extends Cylinder {
    constructor(gl, radius, total, current = total, branchable = true) {
        const topRadius = (current - 1) / total
        const bottomRadius = current / total
        const sides = Math.floor(Math.max(bottomRadius * 14, 3))
        const length = Math.pow(bottomRadius, 2) * 2 + 2

        super(gl, length, radius * topRadius, radius * bottomRadius, sides)

        this.color = [0.47, 0.32, 0.24, 1]

        // rotate self
        if (Math.random() < 0.3) {
            this.rotate(topRadius - 0.7, 0.71, 0, 0.71)
        } else {
            this.rotate(-(topRadius - 0.7), 0.71, 0, 0.71)
        }

        // twigs
        for (let i = 0; i < 5; i++) {
            if (Math.random() < Math.pow(1 - bottomRadius, 2) && 2 < current && branchable) {
                const axis = vector.normalize([Math.random() - 0.5, 0, Math.random() - 0.5, 0])
                this.children.push(
                    new Branch(gl, topRadius, total, current - 1, false).rotate(1, ...axis)
                )
            }
        }

        // continue current
        if (2 < current) {
            if (Math.random() < Math.pow(bottomRadius, 1)) {
                // branch
                const axis = vector.normalize([Math.random() - 0.5, 0, Math.random() - 0.5, 0])
                this.children.push(
                    new Branch(gl, topRadius, total, current - 1).rotate(0.6, ...axis),
                    new Branch(gl, topRadius, total, current - 1).rotate(-0.6, ...axis)
                )
            } else {
                // don't branch
                this.children.push(new Branch(gl, topRadius, total, current - 1))
            }
        } else {
            this.children.push(new Leaf(gl, 0.5))
            for (let i = 0; i < 4; i++) {
                const axis = vector.normalize([Math.random() - 0.5, 0, Math.random() - 0.5, 0])
                this.children.push(
                    new Leaf(gl, 0.5).translate(0, -1 * Math.random() * 2, 0).rotate(0.8, ...axis)
                )
            }
        }
    }
}

class Tree extends Cylinder {
    constructor(gl) {
        const pointers = {
            breaks: 4
        }
        super(gl, 3, 1, 2)
        this.color = [0.47, 0.32, 0.24, 1]
        this.children.push(new Branch(gl, 1, 9))
    }

    // draw(gl, shader, delta) {
    //     // this.trunk.rotateY(delta)
    //     this.trunk.draw(gl, shader)
    // }
}
