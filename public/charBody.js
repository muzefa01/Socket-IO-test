import { Joint, SpineBox } from './drawUtils.js'
// import { Geom } from "phaser";
Geom = phaser.Geom
const PI = Math.PI

function intpl(a, b, k) { // interpolate
  return a*(1-k) + b*k
}

function vectIntpl(a, b, k) { // vector interpolate
  return {
    x: intpl(a.x, b.x, k),
    y: intpl(a.y, b.y, k)
  }
}

class CharBody {
  constructor(owner, basePos, attributes) {
    this.owner = owner
    this.basePos = basePos
    this.frame = 0
    
     // tentatively declaring which stats affect each body attribute here
      this.height = attributes.height // HP, SPD
      this.bodyWidth = attributes.bodyWidth // HP, DEF
      this.neckBaseRatio = attributes.neckBaseRatio // DEF
      this.leanForward = attributes.leanForward // ATK
      this.neckType = attributes.neckType // DEF
      
      this.armLengthRatio = attributes.armLengthRatio // SPD
      this.armWidthRatio = attributes.armWidthRatio // ATK, DEF
      this.weaponGrip = attributes.weaponGrip // ATK, SPD

      this.animSpeed = attributes.animSpeed // SPD

      this.weaponType = attributes.weaponType
      this.headType = attributes.headType
      
    // i apologise for the unreadable mess of numbers here, it doesn't really get any cleaner

    // torso
    this.baseWidth = this.bodyWidth + 0.1*this.height - 20
    this.neckWidth = this.baseWidth * this.neckBaseRatio
    this.torso = new SpineBox(this.owner, [
      new Joint(this.basePos.x, this.basePos.y, this.baseWidth, 0, -PI/2),
      new Joint(this.basePos.x, this.basePos.y-this.height*0.7, this.neckWidth*0.6 + this.baseWidth*0.4),
      new Joint(this.basePos.x-this.leanForward, this.basePos.y-this.height+0.25*this.leanForward, this.neckWidth)
    ])
    this.neckPosX = this.torso.joints[2].posX
    this.neckPosY = this.torso.joints[2].posY

    // arms
    this.armsCentre = vectIntpl(this.torso.joints[1].getPos(), this.torso.joints[2].getPos(), 0.7)
    this.shoulderWidth = (this.neckWidth*0.8 + this.baseWidth*0.2) * 0.9
    this.wristWidth = this.shoulderWidth*this.armLengthRatio
    this.armLength = this.armLengthRatio*this.height
    this.armsAngleBase = PI*12/8
    this.armsAngle = this.armsAngleBase
    this.arms = []
    const side = [-1, 1]
    for (let i in [-1, 1]) {
      const shoulderX = this.armsCentre.x + side[i]*(5 + this.neckWidth*0.2)
      this.arms.push(new SpineBox(this.owner, [
        new Joint(shoulderX, this.armsCentre.y, this.shoulderWidth),
        new Joint(shoulderX + Math.cos(this.armsAngle)*this.armLength*0.4, this.armsCentre.y - Math.sin(this.armsAngle)*this.armLength*0.4, this.wristWidth*0.4 + this.shoulderWidth*0.6),
      ]))
      this.arms[i].joints.push(
        new Joint(this.arms[i].joints[1].posX + Math.cos(this.armsAngle - PI/8)*this.armLength*0.6, this.arms[i].joints[1].posY - Math.sin(this.armsAngle - PI/8)*this.armLength*0.6, this.wristWidth)
      )
      this.arms[i].update()
    }
    this.arms[0].graphics.setDepth(1)
    this.arms[1].graphics.setDepth(4)
    this.torso.graphics.setDepth(2)

    this.hands = []
    for (let i in this.arms) {
      const circleParams = [this.arms[i].joints[2].posX, this.arms[i].joints[2].posY, this.arms[i].joints[2].width * 0.9]
      this.hands.push(this.owner.add.graphics())
      this.hands[i].lineStyle(4, 0xFFFFFF, 1.0)
      this.hands[i].fillStyle(0x000000, 1.0);
      this.hands[i].fillCircleShape(new Geom.Circle(...circleParams))
      this.hands[i].strokeCircleShape(new Geom.Circle(...circleParams))
    }

    // head
    this.headScale = this.neckWidth/100 + this.bodyWidth/150 + 0.15
    this.headPos = {
      x: this.basePos.x
        -(this.leanForward+5)*(1+this.headScale),
      y: this.basePos.y
        -this.height*(1 + this.headScale*0.15)
        +0.25*this.leanForward*(1+this.headScale)
        -(8*this.headScale)}
    this.head = this.owner.add.image(this.headPos.x, this.headPos.y, 'head1');
    this.head.setDepth(5)
    this.head.scale = this.headScale
    this.head.rotation = -0.2
    
    // draw
    this.torso.draw()
    this.arms[0].draw()
    this.arms[1].draw()
  }

  frameAdvance() {
    this.frame = (this.frame + this.animSpeed) % (2*PI*1000)
    this.update()
  }

  updateArms() {
    this.armsCentre = vectIntpl(this.torso.joints[1].getPos(), this.torso.joints[2].getPos(), 0.7)
    const side = [-1, 1]
    for (let i in [-1, 1]) {
      const shoulderX = this.armsCentre.x + side[i]*(5 + this.neckWidth*0.2)
      this.arms[i].joints[0].setPos({x: shoulderX, y: this.armsCentre.y})
      this.arms[i].joints[1].setPos({
        x: shoulderX + Math.cos(this.armsAngle)*this.armLength*0.4, 
        y: this.armsCentre.y - Math.sin(this.armsAngle)*this.armLength*0.4})
      this.arms[i].joints[2].setPos({
        x: this.arms[i].joints[1].posX + Math.cos(this.armsAngle - PI/8)*this.armLength*0.6,
        y: this.arms[i].joints[1].posY - Math.sin(this.armsAngle - PI/8)*this.armLength*0.6})
      this.arms[i].update()
    }

    for (let i in this.hands) {
      const circleParams = [this.arms[i].joints[2].posX, this.arms[i].joints[2].posY, this.arms[i].joints[2].width * 0.9]
      this.hands[i].clear()
      this.hands[i].lineStyle(4, 0xFFFFFF, 1.0)
      this.hands[i].fillStyle(0x000000, 1.0);
      this.hands[i].fillCircleShape(new Geom.Circle(...circleParams))
      this.hands[i].strokeCircleShape(new Geom.Circle(...circleParams))
      this.hands[i].setDepth(i*2)
    }
  }

  update() {
    const breathOffset = Math.sin(this.frame/20)*(this.height/150 + 2)

    this.head.y = this.headPos.y + breathOffset
    this.torso.joints[2].posY = this.neckPosY + breathOffset*0.5

    this.head.x = this.headPos.x - breathOffset*0.3
    this.torso.joints[2].posX = this.neckPosX - breathOffset*0.3

    this.armsAngle = this.armsAngleBase - Math.sin(this.frame/20 + PI/2)*0.02
    this.updateArms()

    this.head.rotation = Math.sin(this.frame/20 + PI/2) *0.03 - 0.2

    this.torso.update()
    this.torso.draw()
    for (let i in this.arms) {
      this.arms[i].draw()
    }
  }

}

export { CharBody }