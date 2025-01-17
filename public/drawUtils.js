import { Geom } from "phaser";

class Joint { // single joint in a spinebox graphic object i.e. body segment (torso, arm etc.)
  constructor (posX, posY, width, angleWeight = 0.5, angleOverride = false) {
    this.posX = posX
    this.posY = posY
    this.width = width // width of the shape at this joint

    /* when determining the angle of a joint, the incoming and outgoing lines are both used. 
    angleWeight is the ratio of incoming to outgoing angles used in the calculation */
    this.angleWeight = angleWeight
    this.angleOverride = angleOverride // or just hardcode the angle in some cases

    // just initialising angle
    this.angle = 0
  }

  setPos(newPos) {
    this.posX = newPos.x
    this.posY = newPos.y
  }
  getPos() {
    return {x: this.posX, y: this.posY}
  }

  ridge(side) { // find position of ridge in the box belonging to this joint
    //side is 1 if left ridge, -1 if right
    const ridgeAngle = mod2pi(this.angle + Math.PI/2)
    return {
      x: this.posX + this.width*Math.cos(ridgeAngle) * side,
      y: this.posY + this.width*Math.sin(ridgeAngle) * side
    }
  }
}

class SpineBox {
  constructor (owner, joints) { // owner is the game object, a.k.a "this" from game.create
    this.joints = joints
    this.owner = owner

    this.graphics = this.owner.add.graphics()
    this.update()
  }

  draw() {
    this.graphics.clear()
    this.graphics.lineStyle(4, 0xFFFFFF, 1.0);
    this.graphics.fillStyle(0x000000, 1.0);
    const polyPoints = new Array(this.joints.length*2)

    for (let i in this.joints) {
      polyPoints[i] = this.joints[i].ridge(1)
      polyPoints[polyPoints.length-1 - i] = this.joints[i].ridge(-1)
    }
    
    this.graphics.fillPoints(polyPoints, true, true)
    this.graphics.strokePoints(polyPoints, true, true)
  }

  drawLine(pos1, pos2) {
    this.graphics.strokeLineShape(new Geom.Line(pos1[0], pos1[1], pos2[0], pos2[1]))
  }

  update() {
    this.bones = [] // initialising invisible "bones" that make up the object
    for (let i = 0; i < this.joints.length-1; i++) {
      this.bones.push(new Geom.Line(this.joints[i].posX, this.joints[i].posY, this.joints[i+1].posX, this.joints[i+1].posY))
    }

    for (let i = 1; i < this.joints.length-1; i++) { // work out angles of second to second-from-last
      if (this.joints[i].angleOverride) {
        this.joints[i].angle = this.joints[i].angleOverride
      } else {
        this.joints[i].angle = midAngle(Geom.Line.Angle(this.bones[i-1]), Geom.Line.Angle(this.bones[i]), this.joints[i].angleWeight)
      }
    }

    if (this.joints[0].angleOverride) { // first
      this.joints[0].angle = this.joints[0].angleOverride
    } else {
      this.joints[0].angle = Geom.Line.Angle(this.bones[0])
    }
    const n = this.joints.length - 1
    if (this.joints[n].angleOverride) { // last
      this.joints[n].angle = this.joints[n].angleOverride
    } else {
      this.joints[n].angle = Geom.Line.Angle(this.bones[n-1])
    }
  }

  }

function midAngle(a1, a2, weight) { // find the angle between two others, weighted
  // weight near 1 brings the resulting angle near a1, and vice versa with weight near 0
  const flip = Math.abs(a1-a2) > Math.PI
  if (flip) weight = 1 - weight // these manipulations are weird to explain in text 
  let result = a1*weight + a2*(1-weight) // ask arda for the diagram if you're curious

  if (flip) {
    result = mod2pi(result+Math.PI)
  }

  return result
}

function mod2pi(a) {
  if (a > Math.PI*2) a -= Math.PI*2
  else if (a < 0) a += Math.PI*2
  return a
}

export { SpineBox, Joint}