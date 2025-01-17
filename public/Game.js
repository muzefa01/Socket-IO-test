
class Game extends Phaser.Scene {
    constructor() {
      super('Game');
      this.socket = null; // Declare the socket variable
      this.otherSprites = []; // Store other player sprites
      this.others = []; // Store other player data
    }
  
    preload() {
      //this.load.image('sky', 'assets/sky.png');
      this.load.image('head1', 'public/assets/head1.png')
    }
  
    create() {
      this.testCharBody = []
        if (true) for (let i = 0; i < 1; i++) {
            this.testCharBody.push(new CharBody(this, {x:100 + i * 150, y:580}, {
                height: 150 + rand()*120, // HP, SPD
                bodyWidth: 30 + rand()*30, // HP, DEF
                neckBaseRatio: 0.28 + rand()*0.37, // DEF
                leanForward: rand()**2*20, // ATK
                neckType: 1, // DEF
                
                armLengthRatio: 0.5+rand()*0.2, // SPD
                armWidthRatio: 0.3 + rand()*0.4, // ATK, DEF
                weaponGrip: 1, // ATK, SPD

                animSpeed: 0.8 + rand()*0.4,

                weaponType: 1,
                headType: 1
            }))
            setInterval(() => this.testCharBody[i].frameAdvance(), 18)}
  
      // Setup Socket.IO
      this.socket = io(); 
    }
  
    update() {
      // Emit player position to the server
      this.socket.emit('updatePlayers', {});
  
   
      if (!this.listenerAdded) {}
    }
  
  
  }
  
  window.Game = Game;

// ANIMATION CLASSES

const PI = Math.PI
const rand = Math.random
const Geom = Phaser.Geom

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
      this.hands[i].setDepth(i*2+1)
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

// 

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: Game,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 300 },
        debug: false,
      },
    },
  };

  const game = new Phaser.Game(config);