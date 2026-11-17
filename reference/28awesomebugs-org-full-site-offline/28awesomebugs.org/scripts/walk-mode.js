(function () {
    'use strict';

    
    const WALK_SCALE    = 0.45;
    const WALK_SPEED    = 1.2;
    const DIR_CHANGE    = 0.012;
    const PAUSE_CHANCE  = 0.008;
    const UNPAUSE       = 0.04;
    const STEP_FREQ     = 7;        
    const LEG_SPREAD    = 0.16;
    const LEG_LENGTH    = 0.55;
    const THIGH_RATIO   = 0.48;
    const THIGH_SWING   = 13;       
    const SHIN_BEND_MAX = 25;       

    const SHRINK_MS     = 500;
    const LEG_GROW_MS   = 350;
    const INTRO_DELAY   = SHRINK_MS;

    const DROP_GRAVITY  = 0.55;     
    const DROP_BOUNCE   = 0.4;      
    const DROP_FRICTION = 0.7;      
    const DROP_STOP_VEL = 1.2;      
    const DROP_LAND_OFF = 40;       
    const WIGGLE_FREQ   = 3;        
    const WIGGLE_AMP    = 55;       

    const RAGDOLL_LIFE  = 2000;     
    const RAGDOLL_FADE  = 500;      
    const RAGDOLL_GRAV  = 0.35;     

    
    const BEH_IDLE_MIN    = 120;    
    const BEH_IDLE_MAX    = 400;
    const BEH_CHANCE      = 0.006;  

    const SIT_DUR_MIN     = 200;    
    const SIT_DUR_MAX     = 500;
    const SIT_TRANSITION  = 20;     
    const SIT_DROP        = 0.45;   

    const SLEEP_DUR_MIN   = 300;
    const SLEEP_DUR_MAX   = 700;
    const SLEEP_TRANSITION = 30;
    const Z_INTERVAL      = 40;     

    const JUMP_HEIGHT     = 25;     
    const JUMP_DUR        = 28;     

    const CONV_APPROACH_DIST = 6;   
    const CONV_TURN_DUR   = 90;    
    const CONV_TURN_PAUSE = 30;    
    const CONV_MIN_TURNS  = 2;     
    const CONV_MAX_TURNS  = 5;     
    const CONV_GAP_MIN    = 300;   
    const CONV_RANGE      = 120;   

    const TRIP_DUR        = 40;     
    const TRIP_RECOVER    = 20;     
    const TRIP_LURCH      = 12;     
    const TRIP_TILT       = 55;     

    const DANCE_DUR_MIN   = 150;
    const DANCE_DUR_MAX   = 350;
    const DANCE_BOUNCE    = 4;      
    const DANCE_SWAY      = 10;     
    const DANCE_SPEED     = 12;     

    const WAVE_DUR        = 70;     
    const WAVE_RANGE      = 100;    

    const TAG_CHASE_SPEED = 2.2;
    const TAG_DUR         = 250;    
    const TAG_CATCH_DIST  = 12;     
    const TAG_FLEE_DUR    = 50;     
    const TAG_ROUNDS_MIN  = 1;
    const TAG_ROUNDS_MAX  = 3;

    const STACK_JUMP_DUR  = 22;     
    const STACK_SIT_MIN   = 200;    
    const STACK_SIT_MAX   = 500;
    const STACK_RANGE     = 100;    
    const STACK_HOP_OFF_H = 20;    

    const SPEED_DRIFT     = 0.003;  
    const SPEED_MIN       = 0.4;
    const SPEED_MAX       = 2.0;

    
    const OCEAN_RISE_SPEED   = 0.6;   
    const OCEAN_DRAIN_SPEED  = 1.2;   
    const OCEAN_MAX_FRAC     = 0.70;  
    const OCEAN_DRAG         = 0.99;  
    const OCEAN_WAVE_AMP     = 4;     
    const OCEAN_WAVE_SPEED   = 0.025; 
    const OCEAN_WAVE_LEN     = 0.012; 
    const OCEAN_SWIM_FACTOR  = 0.35;  
    const CHAIN_BALLS       = 10;   
    const BALL_RADIUS        = 6;    
    const CHAIN_LINK_LEN     = BALL_RADIUS * 2; 
    const CHAIN_ITER         = 20;   
    const PLUG_PULL_RESIST   = 0.01; 
    const PLUG_POP_DIST      = 70;    
    const PLUG_BUDGE_DIST    = 5;    
    const PLUG_WIDTH         = 80;   
    const PLUG_CAP_HEIGHT    = 10;   
    const PLUG_CORK_HEIGHT   = 34;   
    const WATER_BOB_AMP      = 0.8;   
    const WATER_DRIFT        = 0.07;   
    const WATER_BUOYANCY     = 0.001;  
    const WATER_CURRENT      = 0.04;  
    const WATER_IMPULSE      = 0.01;   
    const PLUG_GRAVITY       = 0.45;  
    const PLUG_BOUNCE        = 0.35;  
    const IS_COARSE_POINTER  = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    

    const CONV_EXCHANGES = [
        ["Hi!", "hi"], ["28", "awesome"], ["Pick a number", "28"],
        ["Nice weather", "ha ha yeah"], ["My cousin was killed by 29", "My family was too"],
        ["ha ha", "he he"], ["My bugs itch", "Same."], ["Dude look under there", "Under where?"],
        ["I love you", "I love you too :)"], ["I'm so fast", "Sure thing whatever dude"],
        ["Wheee!", ":D"], ["Bug life!", "The best!"],
        ["*wave*", "*wave back*"], ["Pull my finger", "dude get away from me"],
        ["hi bubby", "hi"], ["i love you", "i love you too"],
        ["Go to the bathroom","not yet"], ["ha ha yay hi", "hi"], ["I love living!", "Me too yay :) smile"],
        ["I love smiling", "ha ha me too"], ["Let's be friends", "Yay!"], ["I have a secret", "Tell me!"],
        
    ];

    const DIRS = [
        { dx:  0, dy: -1, name: 'up'    },
        { dx:  0, dy:  1, name: 'down'  },
        { dx: -1, dy:  0, name: 'left'  },
        { dx:  1, dy:  0, name: 'right' },
        { dx: -0.707, dy: -0.707, name: 'ul' },
        { dx:  0.707, dy: -0.707, name: 'ur' },
        { dx: -0.707, dy:  0.707, name: 'dl' },
        { dx:  0.707, dy:  0.707, name: 'dr' }
    ];

    
    let enabled  = false;
    let walking  = false;
    let transitioning = false; 
    let walkers  = [];     
    let rafId    = null;
    let savedAnimationRunning = true;
    let savedSizes = [];
    let cachedHeaderH = 0;
    let container = null;
    let activeSmallSize = 0; 
    let ragdolls = [];     
    let zParticles = [];   
    let speechBubbles = []; 
    let stacks = [];       

    
    let oceanActive   = false;  
    let oceanDraining = false;  
    let oceanLevel    = 0;      
    let oceanTick     = 0;      
    let oceanWaterEl  = null;   
    let oceanCanvas   = null;   
    let oceanCtx      = null;
    let oceanDrainEl  = null;   
    let oceanPlugEl   = null;   
    let oceanChainCvs = null;   
    let oceanChainCtx = null;
    let plugX = 0, plugY = 0;   
    let plugAnchorX = 0, plugAnchorY = 0; 
    let plugGrabbed = false;    
    let plugGrabOff = { x: 0, y: 0 }; 
    let plugPulled  = false;    
    let plugFree    = false;    
    let plugVelX = 0, plugVelY = 0; 
    let plugFade = false;       
    let plugHeld = false;       
    let plugProgress = 0;       
    let plugPullTime = 0;       
    let chainEndX = 0, chainEndY = 0; 
    let chainGrabEl = null;     
    let chainBalls = [];        
    let chainGrabIdx = -1;     
    let chainMouseTarget = { x: 0, y: 0 }; 
    let oceanRafId  = null;     

    
    let heldWalker  = null;
    let holdOffsetX = 0;
    let holdOffsetY = 0;
    let pointerX    = 0;
    let pointerY    = 0;

    function getBugData() {
        return (window.BugSim && window.BugSim.getBugData) ? window.BugSim.getBugData() : [];
    }
    function randDir() { return DIRS[Math.floor(Math.random() * DIRS.length)]; }
    function randSwimDir() { const a = Math.random() * Math.PI * 2; return { dx: Math.cos(a), dy: Math.sin(a) }; }

    
    function createLegsCanvas(bugSize) {
        const canvasW = Math.round(bugSize * 1.6);
        const canvasH = Math.round(bugSize * LEG_LENGTH + 8);
        const c = document.createElement('canvas');
        c.className = 'walk-legs';
        c.width  = canvasW;
        c.height = canvasH;
        c.style.width  = canvasW + 'px';
        c.style.height = canvasH + 'px';
        c.style.opacity = '0';
        c.style.transform = 'scaleY(0)';
        c.style.transformOrigin = 'top center';
        if (!container) container = document.querySelector('.bugs-container');
        container.appendChild(c);
        return { canvas: c, ctx: c.getContext('2d'), w: canvasW, h: canvasH };
    }

    function positionLegs(legs, bugX, bugY, bugSize, swimRot) {
        if (swimRot) {
            
            
            const rad = swimRot * Math.PI / 180;
            const cx = bugX + bugSize / 2;
            const cy = bugY + bugSize / 2;
            
            const dy = bugSize / 2 - 2;
            const rx = -dy * Math.sin(rad);
            const ry =  dy * Math.cos(rad);
            const attachX = cx + rx;
            const attachY = cy + ry;
            legs.canvas.style.left = (attachX - legs.w / 2) + 'px';
            legs.canvas.style.top  = attachY + 'px';
            legs.canvas.style.transformOrigin = 'top center';
            legs.canvas.style.transform = `rotate(${swimRot}deg)`;
        } else {
            legs.canvas.style.left = (bugX + bugSize / 2 - legs.w / 2) + 'px';
            legs.canvas.style.top  = (bugY + bugSize - 2) + 'px';
            if (legs.canvas.style.transform.includes('rotate')) {
                legs.canvas.style.transform = '';
            }
        }
    }

    
    function drawSegment(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    function drawDot(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    
    function drawLegs(legs, bugSize, tick, dir, isIdle, growFrac, isHeld, behavior, isSwimming) {
        const { canvas, ctx } = legs;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const maxLen   = bugSize * LEG_LENGTH * growFrac;
        const thighLen = maxLen * THIGH_RATIO;
        const shinLen  = maxLen * (1 - THIGH_RATIO);
        const spread   = bugSize * LEG_SPREAD;
        const cx       = w / 2;
        const hipY     = 2;
        const DEG      = Math.PI / 180;

        ctx.strokeStyle = '#222';
        ctx.lineWidth   = 2.4;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';

        if (isHeld) {
            
            for (let side = -1; side <= 1; side += 2) {
                const hipX = cx + side * spread;
                const phase = Math.sin((tick / WIGGLE_FREQ) * Math.PI + side * 1.3)
                            + Math.sin((tick / (WIGGLE_FREQ * 0.7)) * Math.PI + side * 2.7) * 0.4;
                const swing = phase * WIGGLE_AMP * (Math.PI / 180);

                const kneeX = hipX + Math.sin(swing) * thighLen;
                const kneeY = hipY + Math.cos(swing) * thighLen;
                const shinSwing = Math.sin((tick / (WIGGLE_FREQ * 0.5)) * Math.PI + side * 0.9) * 40 * (Math.PI / 180);
                const footX = kneeX + Math.sin(swing + shinSwing) * shinLen;
                const footY = kneeY + Math.cos(swing + shinSwing) * shinLen;

                drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                drawSegment(ctx, kneeX, kneeY, footX, footY);
                drawDot(ctx, footX, footY, 2.2, '#222');
                drawDot(ctx, kneeX, kneeY, 1.6, '#444');
            }
            return;
        }

        
        if (isSwimming && !isHeld) {
            
            const swimTick = tick; 
            const moving = !isIdle;
            if (moving) {
                
                
                const cycleLen = 50;
                const phase = swimTick % cycleLen;
                const maxThigh = 45 * DEG;
                const maxShin  = -60 * DEG; 
                for (let side = -1; side <= 1; side += 2) {
                    const hipX = cx + side * spread;
                    let thighAng, shinAng;
                    if (phase < 15) {
                        
                        const t = phase / 15;
                        const ease = t * t;
                        thighAng = ease * maxThigh * side;
                        shinAng  = ease * maxShin * side;
                    } else if (phase < 30) {
                        
                        const t = (phase - 15) / 15;
                        const ease = t * t * (3 - 2 * t); 
                        thighAng = maxThigh * side;
                        shinAng  = (maxShin + (0 - maxShin) * ease) * side; 
                    } else {
                        
                        const t = (phase - 30) / 20;
                        const ease = t * t * (3 - 2 * t); 
                        thighAng = (1 - ease) * maxThigh * side;
                        shinAng  = 0; 
                    }
                    const kneeX = hipX + Math.sin(thighAng) * thighLen;
                    const kneeY = hipY + Math.cos(Math.abs(thighAng)) * thighLen;
                    const totalAng = thighAng + shinAng;
                    const footX = kneeX + Math.sin(totalAng) * shinLen;
                    const footY = kneeY + Math.cos(Math.abs(totalAng)) * shinLen;
                    drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                    drawSegment(ctx, kneeX, kneeY, footX, footY);
                    drawDot(ctx, footX, footY, 2.2, '#222');
                    drawDot(ctx, kneeX, kneeY, 1.6, '#444');
                }
            } else {
                
                const idleFreq = 0.03;
                const phase = swimTick * idleFreq;
                for (let side = -1; side <= 1; side += 2) {
                    const hipX = cx + side * spread;
                    const gentleSway = Math.sin(phase + side * 0.8) * 8 * DEG * side;
                    const kneeX = hipX + Math.sin(gentleSway) * thighLen;
                    const kneeY = hipY + Math.cos(Math.abs(gentleSway)) * thighLen;
                    const shinSway = Math.sin(phase * 0.7 + side * 1.2) * 5 * DEG * side;
                    const footX = kneeX + Math.sin(gentleSway + shinSway) * shinLen;
                    const footY = kneeY + Math.cos(Math.abs(gentleSway + shinSway)) * shinLen;
                    drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                    drawSegment(ctx, kneeX, kneeY, footX, footY);
                    drawDot(ctx, footX, footY, 2.2, '#222');
                    drawDot(ctx, kneeX, kneeY, 1.6, '#444');
                }
            }
            return;
        }

        
        if (behavior && behavior.type === 'sit') {
            const t = behavior.blend;
            const facing = behavior.facing || 1; 
            const bendAng = t * 85 * DEG;

            for (let side = -1; side <= 1; side += 2) {
                const hipX = cx + side * spread;
                
                const thighDir = facing;
                const kneeX = hipX + Math.sin(bendAng) * thighDir * thighLen;
                const kneeY = hipY + Math.cos(bendAng) * thighLen;
                
                const shinAng = bendAng * 0.3;
                const footX = kneeX - Math.sin(shinAng) * thighDir * shinLen;
                const footY = kneeY + Math.cos(shinAng) * shinLen;

                drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                drawSegment(ctx, kneeX, kneeY, footX, footY);
                drawDot(ctx, footX, footY, 2.2, '#222');
                drawDot(ctx, kneeX, kneeY, 1.6, '#444');
            }
            return;
        }

        
        if (behavior && behavior.type === 'sleep') {
            const t = behavior.blend;
            const facing = behavior.facing || 1;

            for (let side = -1; side <= 1; side += 2) {
                const hipX = cx + side * spread;
                
                const splayAng = t * 70 * DEG * side;
                const kneeX = hipX + Math.sin(splayAng) * thighLen;
                const kneeY = hipY + Math.cos(splayAng) * thighLen;
                
                const fAng = splayAng + t * 20 * DEG * side;
                const footX = kneeX + Math.sin(fAng) * shinLen;
                const footY = kneeY + Math.cos(fAng) * shinLen;

                drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                drawSegment(ctx, kneeX, kneeY, footX, footY);
                drawDot(ctx, footX, footY, 2.2, '#222');
                drawDot(ctx, kneeX, kneeY, 1.6, '#444');
            }
            return;
        }

        
        if (behavior && (behavior.type === 'jump' || behavior.type === 'stack-jump')) {
            const t = behavior.blend; 
            const tuck = Math.sin(t * Math.PI) * 55 * DEG;

            for (let side = -1; side <= 1; side += 2) {
                const hipX = cx + side * spread;
                const kneeX = hipX + Math.sin(tuck) * side * thighLen * 0.3;
                const kneeY = hipY + Math.cos(tuck) * thighLen;
                const footX = kneeX + Math.sin(tuck * 0.6) * side * shinLen * 0.2;
                const footY = kneeY + Math.cos(tuck * 0.6) * shinLen;

                drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                drawSegment(ctx, kneeX, kneeY, footX, footY);
                drawDot(ctx, footX, footY, 2.2, '#222');
                drawDot(ctx, kneeX, kneeY, 1.6, '#444');
            }
            return;
        }

        
        if (behavior && behavior.type === 'trip') {
            const t = behavior.blend; 
            const tangle = t * 40 * DEG;
            for (let side = -1; side <= 1; side += 2) {
                const hipX = cx + side * spread;
                
                const cross = side * -1; 
                const kneeX = hipX + Math.sin(tangle * cross) * thighLen * 0.6;
                const kneeY = hipY + Math.cos(tangle) * thighLen;
                const footX = kneeX + Math.sin(tangle * cross * 0.5) * shinLen * 0.4;
                const footY = kneeY + Math.cos(tangle * 0.7) * shinLen;
                drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                drawSegment(ctx, kneeX, kneeY, footX, footY);
                drawDot(ctx, footX, footY, 2.2, '#222');
                drawDot(ctx, kneeX, kneeY, 1.6, '#444');
            }
            return;
        }

        
        if (behavior && behavior.type === 'dance') {
            const beat = (behavior.danceTick || 0);
            const phase = (beat / DANCE_SPEED) * Math.PI;
            for (let side = -1; side <= 1; side += 2) {
                const hipX = cx + side * spread;
                const legPhase = phase + (side === 1 ? Math.PI : 0);
                
                const kick = Math.sin(legPhase) * 50 * DEG;
                const kneeX = hipX + Math.sin(kick) * side * thighLen * 0.5;
                const kneeY = hipY + Math.cos(kick) * thighLen;
                const shinKick = Math.max(0, Math.sin(legPhase)) * 35 * DEG;
                const footX = kneeX + Math.sin(kick + shinKick * side) * shinLen * 0.4;
                const footY = kneeY + Math.cos(kick + shinKick) * shinLen;
                drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                drawSegment(ctx, kneeX, kneeY, footX, footY);
                drawDot(ctx, footX, footY, 2.2, '#222');
                drawDot(ctx, kneeX, kneeY, 1.6, '#444');
            }
            return;
        }

        
        if (behavior && (behavior.type === 'stacked' || behavior.type === 'stack-hop-off')) {
            
            if (behavior.type === 'stacked' && behavior.stackIndex === 0) {
                
            } else {
                for (let side = -1; side <= 1; side += 2) {
                    const hipX = cx + side * spread;
                    
                    const sway = Math.sin(tick * 0.08 + side) * 8 * DEG;
                    const kneeX = hipX + Math.sin(sway + side * 15 * DEG) * thighLen;
                    const kneeY = hipY + Math.cos(sway) * thighLen;
                    const footX = kneeX + Math.sin(sway + side * 10 * DEG) * shinLen;
                    const footY = kneeY + Math.cos(sway) * shinLen;
                    drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                    drawSegment(ctx, kneeX, kneeY, footX, footY);
                    drawDot(ctx, footX, footY, 2.2, '#222');
                    drawDot(ctx, kneeX, kneeY, 1.6, '#444');
                }
                return;
            }
        }

        if (isIdle) {
            
            for (let side = -1; side <= 1; side += 2) {
                const hipX = cx + side * spread;
                const kneeX = hipX;
                const kneeY = hipY + thighLen;
                const footX = hipX;
                const footY = kneeY + shinLen;
                drawSegment(ctx, hipX, hipY, kneeX, kneeY);
                drawSegment(ctx, kneeX, kneeY, footX, footY);
                drawDot(ctx, footX, footY, 2.2, '#222');
                drawDot(ctx, kneeX, kneeY, 1.6, '#444');
            }
            return;
        }

        
        
        const tdx = dir.dx;
        const tdy = dir.dy;
        const basePhase = (tick / STEP_FREQ) * Math.PI;

        const hasHoriz = Math.abs(tdx) > 0.3;
        const pureVert = !hasHoriz;

        for (let side = -1; side <= 1; side += 2) {
            const hipX = cx + side * spread;

            
            const legPhase = basePhase + (side === 1 ? Math.PI : 0);

            
            const thighAng = THIGH_SWING * DEG * Math.cos(legPhase);

            
            const shinBend = SHIN_BEND_MAX * DEG * Math.max(0, Math.sin(legPhase - Math.PI));
            const shinAng = thighAng - shinBend;

            let kneeX, kneeY, footX, footY;

            if (pureVert) {
                
                
                
                const thighDY = Math.cos(thighAng) * thighLen;
                const thighDX = Math.sin(thighAng) * thighLen * 0.25; 

                kneeX = hipX + side * thighDX;
                kneeY = hipY + thighDY;

                const shinDY = Math.cos(shinAng) * shinLen;
                const shinDX = Math.sin(shinAng) * shinLen * 0.25;

                footX = kneeX + side * shinDX;
                footY = kneeY + shinDY;
            } else {
                
                const sdx = Math.sign(tdx);

                kneeX = hipX + Math.sin(thighAng) * sdx * thighLen;
                kneeY = hipY + Math.cos(thighAng) * thighLen;

                footX = kneeX + Math.sin(shinAng) * sdx * shinLen;
                footY = kneeY + Math.cos(shinAng) * shinLen;
            }

            drawSegment(ctx, hipX, hipY, kneeX, kneeY);
            drawSegment(ctx, kneeX, kneeY, footX, footY);
            drawDot(ctx, footX, footY, 2.2, '#222');
            drawDot(ctx, kneeX, kneeY, 1.6, '#444');
        }
    }

    
    function runIntro(bugData, bigSize, smallSize, onDone) {
        for (let i = 0; i < bugData.length; i++) {
            bugData[i].element.style.transition =
                `width ${SHRINK_MS}ms ease-in-out, height ${SHRINK_MS}ms ease-in-out`;
        }
        requestAnimationFrame(function () {
            for (let i = 0; i < bugData.length; i++) {
                const el = bugData[i].element;
                el.style.width  = smallSize + 'px';
                el.style.height = smallSize + 'px';
            }
        });
        setTimeout(function () {
            for (let i = 0; i < walkers.length; i++) {
                const c = walkers[i].legs.canvas;
                c.style.transition = `opacity ${LEG_GROW_MS}ms ease-out, transform ${LEG_GROW_MS}ms ease-out`;
                c.style.opacity = '1';
                c.style.transform = 'scaleY(1)';
            }
            setTimeout(function () {
                for (let i = 0; i < bugData.length; i++)
                    bugData[i].element.style.transition = '';
                walking = true;
                transitioning = false;
                if (onDone) onDone();
            }, LEG_GROW_MS);
        }, INTRO_DELAY);
    }

    function runOutro(onDone) {
        walking = false;
        for (let i = 0; i < walkers.length; i++) {
            const c = walkers[i].legs.canvas;
            c.style.transition = `opacity ${LEG_GROW_MS}ms ease-in, transform ${LEG_GROW_MS}ms ease-in`;
            c.style.opacity = '0';
            c.style.transform = 'scaleY(0)';
        }
        setTimeout(function () {
            for (let i = 0; i < savedSizes.length; i++) {
                const s = savedSizes[i];
                const el = s.bug.element;
                el.style.transition = `width ${SHRINK_MS}ms ease-in-out, height ${SHRINK_MS}ms ease-in-out`;
                el.style.width  = s.origWidth;
                el.style.height = s.origHeight;
                
                if (s.origRadius !== undefined) s.bug.radius = s.origRadius;
                
                if (s.bug.hat) {
                    s.bug.hat.style.width  = '50px';
                    s.bug.hat.style.height = '50px';
                }
                
                if (s.bug.horns && window.updateHornAttachment) {
                    window.updateHornAttachment(s.bug);
                }
            }
            activeSmallSize = 0;
            setTimeout(function () {
                for (let i = 0; i < savedSizes.length; i++)
                    savedSizes[i].bug.element.style.transition = '';
                transitioning = false;
                if (onDone) onDone();
            }, SHRINK_MS);
        }, LEG_GROW_MS);
    }

    
    function walkerForElement(el) {
        for (let i = 0; i < walkers.length; i++) {
            if (walkers[i].bug.element === el) return walkers[i];
        }
        return null;
    }

    function onPointerDown(e) {
        if (!walking) return;
        const el = e.target.closest('.bug');
        if (!el) return;
        const w = walkerForElement(el);
        if (!w || w.dropping) return;

        e.preventDefault();
        e.stopPropagation();
        heldWalker = w;
        w.held = true;
        w.paused = false;
        
        if (w.beh && w.beh.type === 'stacked' && w.beh.stackRef) {
            dismountStack(w.beh.stackRef, w.beh.stackIndex);
        }
        
        if (w.beh) {
            w.beh = null;
            w.bug.element.style.transform = `translate3d(${w.bug.x}px, ${w.bug.y}px, 0)`;
        }

        const rect = container.getBoundingClientRect();
        pointerX = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
        pointerY = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
        holdOffsetX = w.bug.x - pointerX;
        holdOffsetY = w.bug.y - pointerY;

        el.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
        if (!heldWalker) return;
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        pointerX = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
        pointerY = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
    }

    function onPointerUp(e) {
        if (!heldWalker) return;
        e.preventDefault();
        const w = heldWalker;
        heldWalker = null;
        w.held = false;

        
        w.dropping = true;
        w.dropVelX = 0;
        w.dropVelY = 0;
        
        const maxFloor = window.innerHeight - w.size;
        w.dropFloor = Math.min(w.bug.y + DROP_LAND_OFF, maxFloor);
    }

    function bindPointerEvents() {
        if (!container) return;
        container.addEventListener('pointerdown', onPointerDown, { passive: false });
        container.addEventListener('pointermove', onPointerMove, { passive: false });
        container.addEventListener('pointerup',   onPointerUp,   { passive: false });
        container.addEventListener('pointercancel', onPointerUp,  { passive: false });
    }

    function unbindPointerEvents() {
        if (!container) return;
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerup',   onPointerUp);
        container.removeEventListener('pointercancel', onPointerUp);
    }

    
    function enable() {
        if (enabled || transitioning) return true;
        enabled = true;
        transitioning = true;
        const bugData = getBugData();
        if (!bugData.length) { enabled = false; return false; }

        const header = document.querySelector('header');
        cachedHeaderH = header ? header.offsetHeight : 0;

        savedAnimationRunning = window.BugSim._getAnimationRunning
            ? window.BugSim._getAnimationRunning() : true;
        if (window.BugSim._setAnimationRunning)
            window.BugSim._setAnimationRunning(false);

        const bugSize   = parseInt(bugData[0].element.style.width) || 75;
        const smallSize = Math.round(bugSize * WALK_SCALE);
        activeSmallSize = smallSize;

        savedSizes = [];
        walkers = [];
        walking = false;
        heldWalker = null;

        for (let i = 0; i < bugData.length; i++) {
            const b  = bugData[i];
            const el = b.element;

            savedSizes.push({ bug: b, origWidth: el.style.width, origHeight: el.style.height, origRadius: b.radius });
            
            b.radius = Math.round(b.radius * WALK_SCALE);
            b.dx = 0;
            b.dy = 0;

            const legs = createLegsCanvas(smallSize);
            positionLegs(legs, b.x, b.y, bugSize);

            walkers.push({
                bug: b,
                dir: randDir(),
                paused: false,
                tick: Math.floor(Math.random() * 100),
                legs: legs,
                size: smallSize,
                legGrow: 0,
                held: false,
                dropping: false,
                dropVelX: 0,
                dropVelY: 0,
                
                beh: null,          
                behCooldown: BEH_IDLE_MIN + Math.floor(Math.random() * BEH_IDLE_MAX),
                speedMult: 0.8 + Math.random() * 0.4,
                convCooldown: 0,
                swimRot: 0,
                _oceanSeed: Math.random() * 10
            });
        }

        
        stopOceanLoop();

        bindPointerEvents();
        rafId = requestAnimationFrame(walkLoop);
        runIntro(bugData, bugSize, smallSize, null);
        return true;
    }

    function disable() {
        if (!enabled || transitioning) return false;
        enabled = false;
        transitioning = true;
        heldWalker = null;

        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        unbindPointerEvents();

        
        if (alienActive || alienCleanupTimer) {
            alienActive = false;
            clearTimeout(alienTimer);
            clearInterval(alienSpawnTimer);
            if (alienCleanupTimer) { clearTimeout(alienCleanupTimer); alienCleanupTimer = null; }
            if (alienRafId) { cancelAnimationFrame(alienRafId); alienRafId = null; }
            
            for (let pi = 0; pi < alienPseudoWalkers.length; pi++) {
                var pw = alienPseudoWalkers[pi];
                if (pw.paused || pw.held) {
                    pw.paused = false; pw.held = false;
                    pw.bug.element.style.display = '';
                    pw.bug.element.style.opacity = '1';
                    pw.bug.dx = pw._savedDx || (Math.random() - 0.5) * 5;
                    pw.bug.dy = pw._savedDy || (Math.random() - 0.5) * 5;
                }
            }
            alienPseudoWalkers = [];
            for (let i = 0; i < alienShips.length; i++) {
                if (alienShips[i].capturedBug) releaseBug(alienShips[i], false);
                if (alienShips[i].el.parentNode) alienShips[i].el.remove();
            }
            alienShips = [];
            if (alienCanvas) { alienCanvas.remove(); alienCanvas = null; alienCtx = null; }
        }

        
        for (let i = 0; i < ragdolls.length; i++) ragdolls[i].canvas.remove();
        ragdolls.length = 0;

        
        for (let i = 0; i < zParticles.length; i++) zParticles[i].el.remove();
        zParticles.length = 0;
        for (let i = 0; i < speechBubbles.length; i++) speechBubbles[i].el.remove();
        speechBubbles.length = 0;
        stacks.length = 0;

        
        const oceanWasActive = oceanActive && !plugFade;
        if (oceanWasActive && !oceanDraining) {
            
            for (let i = 0; i < walkers.length; i++) {
                walkers[i].swimRot = 0;
            }
        } else if (!oceanWasActive) {
            destroyOceanDOM();
            stopOceanLoop();
            oceanActive = false;
            oceanDraining = false;
            oceanLevel = 0;
            plugPulled = false;
            plugFade = false;
            plugHeld = false;
            plugFree = false;
            plugGrabbed = false;
            plugProgress = 0;
            plugPullTime = 0;
            chainEndX = 0;
            chainEndY = 0;
            chainGrabEl = null;
        }

        
        for (let i = 0; i < walkers.length; i++) {
            const wb = walkers[i].bug;
            wb.element.style.transform = `translate3d(${wb.x}px, ${wb.y}px, 0)`;
        }

        runOutro(function () {
            for (let i = 0; i < walkers.length; i++) {
                const c = walkers[i].legs.canvas;
                if (c.parentNode) c.parentNode.removeChild(c);
            }
            walkers = [];
            savedSizes = [];

            if (window.BugSim._setAnimationRunning) {
                window.BugSim._setAnimationRunning(savedAnimationRunning);
                if (savedAnimationRunning && window.BugSim._requestUpdate)
                    window.BugSim._requestUpdate();
            }

            
            if (oceanWasActive) {
                startOceanLoop();
            }
        });
        return false;
    }

    function toggle() {
        return enabled ? (disable(), false) : (enable(), true);
    }

    
    function spawnRagdollLegs(w) {
        const bugSize = w.size;
        const maxLen   = bugSize * LEG_LENGTH;
        const thighLen = maxLen * THIGH_RATIO;
        const shinLen  = maxLen * (1 - THIGH_RATIO);
        const spread   = bugSize * LEG_SPREAD;
        const DEG      = Math.PI / 180;

        
        const basePhase = (w.tick / STEP_FREQ) * Math.PI;

        
        const originX = w.bug.x + bugSize / 2;
        const originY = w.bug.y + bugSize - 2;

        for (let side = -1; side <= 1; side += 2) {
            const legPhase = basePhase + (side === 1 ? Math.PI : 0);
            const thighAng = THIGH_SWING * DEG * Math.cos(legPhase);
            const shinBend = SHIN_BEND_MAX * DEG * Math.max(0, Math.sin(legPhase - Math.PI));
            const shinAng  = thighAng - shinBend;

            
            const pad = 4;
            const cSize = Math.round(maxLen + pad * 2);
            const c = document.createElement('canvas');
            c.className = 'walk-legs';
            c.width  = cSize;
            c.height = cSize;
            c.style.width  = cSize + 'px';
            c.style.height = cSize + 'px';
            c.style.opacity = '1';
            c.style.transform = 'none';
            c.style.zIndex = '9999';
            if (!container) container = document.querySelector('.bugs-container');
            container.appendChild(c);

            
            const hipWorldX = originX + side * spread;

            ragdolls.push({
                canvas: c,
                ctx: c.getContext('2d'),
                w: cSize,
                h: cSize,
                x: hipWorldX - cSize / 2,
                y: originY - pad,
                vx: side * (3 + Math.random() * 4),
                vy: -(4 + Math.random() * 5),
                rot: 0,
                vr: side * (0.08 + Math.random() * 0.15),
                thighLen: thighLen,
                shinLen: shinLen,
                thighAng: thighAng,
                shinAng: shinAng,
                born: performance.now(),
                pad: pad
            });
        }
    }

    function drawRagdollLeg(r) {
        const { ctx, w, h, pad, thighLen, shinLen, thighAng, shinAng, rot } = r;
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, pad);
        ctx.rotate(rot);

        ctx.strokeStyle = '#222';
        ctx.lineWidth   = 2.4;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';

        
        const kneeX = Math.sin(thighAng) * thighLen;
        const kneeY = Math.cos(thighAng) * thighLen;
        const footX = kneeX + Math.sin(shinAng) * shinLen;
        const footY = kneeY + Math.cos(shinAng) * shinLen;

        drawSegment(ctx, 0, 0, kneeX, kneeY);
        drawSegment(ctx, kneeX, kneeY, footX, footY);
        drawDot(ctx, footX, footY, 2.2, '#222');
        drawDot(ctx, kneeX, kneeY, 1.6, '#444');

        ctx.restore();
    }

    function updateRagdolls(now) {
        for (let i = ragdolls.length - 1; i >= 0; i--) {
            const r = ragdolls[i];
            const age = now - r.born;

            
            if (age > RAGDOLL_LIFE) {
                r.canvas.remove();
                ragdolls.splice(i, 1);
                continue;
            }

            
            r.vy += RAGDOLL_GRAV;
            r.x += r.vx;
            r.y += r.vy;
            r.rot += r.vr;

            
            const fadeStart = RAGDOLL_LIFE - RAGDOLL_FADE;
            if (age > fadeStart) {
                r.canvas.style.opacity = String(1 - (age - fadeStart) / RAGDOLL_FADE);
            }

            
            r.canvas.style.left = r.x + 'px';
            r.canvas.style.top  = r.y + 'px';

            drawRagdollLeg(r);
        }
    }

    
    function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

    function spawnZ(bx, by, bugSize) {
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'walk-z';
        el.textContent = 'Z';
        el.style.left = (bx + bugSize / 2 + (Math.random() - 0.5) * 6) + 'px';
        el.style.top  = (by - 2) + 'px';
        container.appendChild(el);
        const z = { el: el, born: performance.now() };
        zParticles.push(z);
        
        setTimeout(function () {
            el.remove();
            const idx = zParticles.indexOf(z);
            if (idx !== -1) zParticles.splice(idx, 1);
        }, 1200);
    }

    function spawnSpeechBubble(bx, by, bugSize, text) {
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'walk-speech';
        el.textContent = text;
        el.style.left = (bx + bugSize / 2) + 'px';
        el.style.top  = (by - 6) + 'px';
        container.appendChild(el);
        const sb = { el: el, born: performance.now() };
        speechBubbles.push(sb);
        setTimeout(function () {
            el.remove();
            const idx = speechBubbles.indexOf(sb);
            if (idx !== -1) speechBubbles.splice(idx, 1);
        }, 2500);
    }

    function pickBehavior(w, allWalkers) {
        
        if (w.held || w.dropping || w.beh) return;
        if (w.behCooldown > 0) { w.behCooldown--; return; }
        if (Math.random() > BEH_CHANCE) return;

        const roll = Math.random();

        if (roll < 0.12) {
            
            const facing = w.dir.dx >= 0 ? 1 : -1;
            w.beh = { type: 'sit', timer: randInt(SIT_DUR_MIN, SIT_DUR_MAX),
                      blend: 0, facing: facing, phase: 'enter' };
            w.paused = true;
        } else if (roll < 0.20) {
            
            const facing = w.dir.dx >= 0 ? 1 : -1;
            w.beh = { type: 'sleep', timer: randInt(SLEEP_DUR_MIN, SLEEP_DUR_MAX),
                      blend: 0, facing: facing, phase: 'enter', zTimer: 0 };
            w.paused = true;
        } else if (roll < 0.28) {
            
            w.beh = { type: 'jump', timer: JUMP_DUR, blend: 0,
                      baseY: w.bug.y, tick: 0 };
        } else if (roll < 0.36) {
            
            const fast = Math.random() < 0.5;
            w.speedMult = fast ? (1.5 + Math.random() * 0.5) : (0.3 + Math.random() * 0.2);
            w.behCooldown = randInt(BEH_IDLE_MIN, BEH_IDLE_MAX);
        } else if (roll < 0.48) {
            
            if (w.convCooldown > 0) { w.behCooldown = 30; return; }
            let best = null, bestDist = CONV_RANGE;
            for (let j = 0; j < allWalkers.length; j++) {
                const o = allWalkers[j];
                if (o === w || o.held || o.dropping || o.beh || o.convCooldown > 0) continue;
                const dx = o.bug.x - w.bug.x;
                const dy = o.bug.y - w.bug.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bestDist) { bestDist = dist; best = o; }
            }
            if (!best) { w.behCooldown = 60; return; }

            const gap = CONV_APPROACH_DIST + w.size;
            const mx = (w.bug.x + best.bug.x) / 2;
            const my = (w.bug.y + best.bug.y) / 2;

            w.beh = { type: 'converse-approach', partner: best,
                      targetX: mx - gap / 2, targetY: my,
                      timer: 200, phase: 'approach' };
            best.beh = { type: 'converse-approach', partner: w,
                         targetX: mx + gap / 2, targetY: my,
                         timer: 200, phase: 'approach' };
        } else if (roll < 0.58) {
            
            const facing = w.dir.dx >= 0 ? 1 : -1;
            w.beh = { type: 'trip', phase: 'stumble', tick: 0, blend: 0, facing: facing };
            w.paused = true;
        } else if (roll < 0.70) {
            
            w.beh = { type: 'dance', timer: randInt(DANCE_DUR_MIN, DANCE_DUR_MAX), danceTick: 0 };
            w.paused = true;
        } else if (roll < 0.78) {
            
            let best = null, bestDist = WAVE_RANGE;
            for (let j = 0; j < allWalkers.length; j++) {
                const o = allWalkers[j];
                if (o === w || o.held || o.dropping || o.beh) continue;
                const dx = o.bug.x - w.bug.x;
                const dy = o.bug.y - w.bug.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bestDist) { bestDist = dist; best = o; }
            }
            if (!best) { w.behCooldown = 40; return; }
            w.beh = { type: 'wave', timer: WAVE_DUR, targetW: best, waved: false };
            w.paused = true;
        } else if (roll < 0.88) {
            
            let best = null, bestDist = CONV_RANGE;
            for (let j = 0; j < allWalkers.length; j++) {
                const o = allWalkers[j];
                if (o === w || o.held || o.dropping || o.beh) continue;
                const dx = o.bug.x - w.bug.x;
                const dy = o.bug.y - w.bug.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bestDist) { bestDist = dist; best = o; }
            }
            if (!best) { w.behCooldown = 60; return; }
            const rounds = randInt(TAG_ROUNDS_MIN, TAG_ROUNDS_MAX);
            w.beh = { type: 'tag-chase', target: best, timer: TAG_DUR, rounds: rounds };
            
            const fleeDir = { dx: Math.sign(best.bug.x - w.bug.x) || 1,
                              dy: (Math.random() - 0.5) > 0 ? 0.5 : -0.5, name: 'flee' };
            best.beh = { type: 'tag-flee', timer: TAG_DUR, fleeDir: fleeDir, partner: w };
        } else {
            
            let best = null, bestDist = STACK_RANGE;
            for (let j = 0; j < allWalkers.length; j++) {
                const o = allWalkers[j];
                if (o === w || o.held || o.dropping) continue;
                
                if (o.beh && o.beh.type !== 'stacked') continue;
                const dx = o.bug.x - w.bug.x;
                const dy = o.bug.y - w.bug.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bestDist) { bestDist = dist; best = o; }
            }
            if (!best) { w.behCooldown = 60; return; }
            w.beh = { type: 'stack-approach', targetW: best, timer: 200 };
        }

        if (w.beh) w.behCooldown = randInt(BEH_IDLE_MIN, BEH_IDLE_MAX);
    }

    function updateBehavior(w, playW, playH) {
        const beh = w.beh;
        if (!beh) return;
        const b = w.bug;

        switch (beh.type) {
            
            case 'sit':
                if (beh.phase === 'enter') {
                    beh.blend = Math.min(1, beh.blend + 1 / SIT_TRANSITION);
                    if (beh.blend >= 1) beh.phase = 'hold';
                } else if (beh.phase === 'hold') {
                    beh.timer--;
                    if (beh.timer <= 0) beh.phase = 'exit';
                } else {
                    beh.blend -= 1 / SIT_TRANSITION;
                    if (beh.blend <= 0) { w.beh = null; w.paused = false; }
                }
                
                if (beh.blend !== undefined) {
                    const drop = beh.blend * w.size * SIT_DROP;
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y + drop}px, 0)`;
                }
                break;

            
            case 'sleep':
                if (beh.phase === 'enter') {
                    beh.blend = Math.min(1, beh.blend + 1 / SLEEP_TRANSITION);
                    if (beh.blend >= 1) beh.phase = 'hold';
                } else if (beh.phase === 'hold') {
                    beh.timer--;
                    beh.zTimer--;
                    if (beh.zTimer <= 0) {
                        spawnZ(b.x, b.y, w.size);
                        beh.zTimer = Z_INTERVAL;
                    }
                    if (beh.timer <= 0) beh.phase = 'exit';
                } else {
                    beh.blend -= 1 / SLEEP_TRANSITION;
                    if (beh.blend <= 0) { w.beh = null; w.paused = false; }
                }
                
                if (beh.blend !== undefined) {
                    const tilt = beh.blend * 80 * beh.facing;
                    const drop = beh.blend * w.size * 0.35;
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y + drop}px, 0) rotate(${tilt}deg)`;
                }
                break;

            
            case 'jump':
                beh.tick++;
                beh.blend = beh.tick / JUMP_DUR; 
                const jumpT = beh.blend;
                const arc = Math.sin(jumpT * Math.PI) * JUMP_HEIGHT;
                b.element.style.transform = `translate3d(${b.x}px, ${beh.baseY - arc}px, 0)`;
                
                if (!w.paused) {
                    const _warpMult = window.__bugSpeedMultiplier || 1;
                    b.x += w.dir.dx * WALK_SPEED * w.speedMult * _warpMult;
                    b.y += w.dir.dy * WALK_SPEED * w.speedMult * _warpMult;
                }
                if (beh.tick >= JUMP_DUR) {
                    w.beh = null;
                    b.y = beh.baseY;
                }
                break;

            
            case 'converse-approach': {
                
                if (!beh.partner || !beh.partner.bug.element || !beh.partner.bug.element.parentNode) {
                    w.beh = null; w.paused = false; w.convCooldown = CONV_GAP_MIN;
                    break;
                }
                const dx = beh.targetX - b.x;
                const dy = beh.targetY - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    const step = Math.min(WALK_SPEED * 1.5, dist);
                    b.x += (dx / dist) * step;
                    b.y += (dy / dist) * step;
                    
                    if (beh.partner) {
                        w.dir = { dx: Math.sign(beh.partner.bug.x - b.x) || 1, dy: 0, name: 'conv' };
                    }
                } else {
                    
                    w.paused = true;
                    beh.type = 'converse-speak';
                    beh.turnsLeft = randInt(CONV_MIN_TURNS, CONV_MAX_TURNS);
                    beh.myTurn = true;  
                    beh.turnTimer = 0;  
                    beh.turnPhase = 'talk'; 
                    beh.spoke = false;
                    
                    if (beh.partner && beh.partner.beh) {
                        beh.partner.beh.type = 'converse-speak';
                        beh.partner.beh.turnsLeft = beh.turnsLeft;
                        beh.partner.beh.myTurn = false;
                        beh.partner.beh.turnTimer = 0;
                        beh.partner.beh.turnPhase = 'talk';
                        beh.partner.beh.spoke = false;
                        beh.partner.paused = true;
                    }
                }
                beh.timer--;
                if (beh.timer <= 0) {
                    
                    w.beh = null; w.paused = false; w.convCooldown = CONV_GAP_MIN;
                    if (beh.partner && beh.partner.beh &&
                        (beh.partner.beh.type === 'converse-approach' || beh.partner.beh.type === 'converse-speak')) {
                        beh.partner.beh = null; beh.partner.paused = false;
                        beh.partner.convCooldown = CONV_GAP_MIN;
                    }
                }
                break;
            }

            
            case 'converse-speak': {
                
                if (beh.partner && (!beh.partner.bug.element || !beh.partner.bug.element.parentNode)) {
                    w.beh = null; w.paused = false; w.convCooldown = CONV_GAP_MIN;
                    break;
                }
                
                if (beh.partner) {
                    w.dir = { dx: Math.sign(beh.partner.bug.x - b.x) || 1, dy: 0, name: 'conv' };
                }

                if (beh.turnPhase === 'talk') {
                    
                    if (beh.myTurn && !beh.spoke) {
                        beh.spoke = true;
                        const pair = CONV_EXCHANGES[Math.floor(Math.random() * CONV_EXCHANGES.length)];
                        spawnSpeechBubble(b.x, b.y, w.size, pair[0]);
                        
                        if (beh.partner && beh.partner.beh) {
                            beh.partner.beh._pendingReply = pair[1];
                        }
                    }
                    beh.turnTimer++;
                    if (beh.myTurn && beh.turnTimer >= CONV_TURN_DUR) {
                        
                        beh.turnPhase = 'pause';
                        beh.turnTimer = 0;
                    }
                    if (!beh.myTurn && beh.turnTimer >= CONV_TURN_DUR) {
                        
                        beh.turnPhase = 'pause';
                        beh.turnTimer = 0;
                    }
                } else if (beh.turnPhase === 'pause') {
                    beh.turnTimer++;
                    if (beh.turnTimer >= CONV_TURN_PAUSE) {
                        
                        if (beh.myTurn) {
                            
                            beh.myTurn = false;
                            beh.turnPhase = 'talk';
                            beh.turnTimer = 0;
                            beh.spoke = false;
                            if (beh.partner && beh.partner.beh) {
                                beh.partner.beh.myTurn = true;
                                beh.partner.beh.turnPhase = 'talk';
                                beh.partner.beh.turnTimer = 0;
                                beh.partner.beh.spoke = false;
                            }
                        } else {
                            
                            beh.turnsLeft--;
                            if (beh.turnsLeft <= 0) {
                                
                                w.beh = null; w.paused = false;
                                w.convCooldown = CONV_GAP_MIN;
                                if (beh.partner && beh.partner.beh &&
                                    beh.partner.beh.type === 'converse-speak') {
                                    beh.partner.beh = null;
                                    beh.partner.paused = false;
                                    beh.partner.convCooldown = CONV_GAP_MIN;
                                }
                            } else {
                                
                                beh.myTurn = true;
                                beh.turnPhase = 'talk';
                                beh.turnTimer = 0;
                                beh.spoke = false;
                                if (beh.partner && beh.partner.beh) {
                                    beh.partner.beh.myTurn = false;
                                    beh.partner.beh.turnPhase = 'talk';
                                    beh.partner.beh.turnTimer = 0;
                                    beh.partner.beh.spoke = false;
                                }
                            }
                        }
                    }
                }

                
                if (beh.myTurn && !beh.spoke && beh._pendingReply) {
                    beh.spoke = true;
                    spawnSpeechBubble(b.x, b.y, w.size, beh._pendingReply);
                    beh._pendingReply = null;
                }
                break;
            }

            
            case 'trip': {
                beh.tick++;
                if (beh.phase === 'stumble') {
                    const t = beh.tick / TRIP_DUR;
                    beh.blend = Math.sin(t * Math.PI); 
                    
                    const facing = beh.facing || 1;
                    b.x += facing * (TRIP_LURCH / TRIP_DUR);
                    
                    const tilt = beh.blend * TRIP_TILT * facing;
                    const drop = beh.blend * w.size * 0.3;
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y + drop}px, 0) rotate(${tilt}deg)`;
                    if (beh.tick >= TRIP_DUR) {
                        beh.phase = 'recover';
                        beh.tick = 0;
                        spawnSpeechBubble(b.x, b.y, w.size, '!');
                    }
                } else {
                    const t = beh.tick / TRIP_RECOVER;
                    beh.blend = 1 - t; 
                    const facing = beh.facing || 1;
                    const tilt = beh.blend * TRIP_TILT * facing;
                    const drop = beh.blend * w.size * 0.3;
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y + drop}px, 0) rotate(${tilt}deg)`;
                    if (beh.tick >= TRIP_RECOVER) {
                        w.beh = null; w.paused = false;
                        b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
                    }
                }
                break;
            }

            
            case 'dance': {
                beh.timer--;
                beh.danceTick = (beh.danceTick || 0) + 1;
                const beat = beh.danceTick;
                const phase = (beat / DANCE_SPEED) * Math.PI;
                
                beh.bounceOff = Math.abs(Math.sin(phase)) * DANCE_BOUNCE;
                const sway = Math.sin(phase * 0.5) * DANCE_SWAY;
                b.element.style.transform = `translate3d(${b.x}px, ${b.y - beh.bounceOff}px, 0) rotate(${sway}deg)`;
                if (beh.timer <= 0) {
                    w.beh = null; w.paused = false;
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
                }
                break;
            }

            
            case 'wave': {
                beh.timer--;
                
                if (beh.targetW) {
                    w.dir = { dx: Math.sign(beh.targetW.bug.x - b.x) || 1, dy: 0, name: 'wave' };
                }
                
                if (!beh.waved) {
                    beh.waved = true;
                    spawnSpeechBubble(b.x, b.y, w.size, '*wave*');
                    
                    if (beh.targetW && !beh.targetW.beh) {
                        const tw = beh.targetW;
                        tw.paused = true;
                        tw.beh = { type: 'wave-back', timer: WAVE_DUR - 15, sourceW: w, waved: false };
                    }
                }
                if (beh.timer <= 0) {
                    w.beh = null; w.paused = false;
                }
                break;
            }
            case 'wave-back': {
                beh.timer--;
                if (beh.sourceW) {
                    w.dir = { dx: Math.sign(beh.sourceW.bug.x - b.x) || 1, dy: 0, name: 'wave' };
                }
                if (!beh.waved) {
                    beh.waved = true;
                    spawnSpeechBubble(b.x, b.y, w.size, '*wave back*');
                }
                if (beh.timer <= 0) {
                    w.beh = null; w.paused = false;
                }
                break;
            }

            
            case 'tag-chase': {
                
                if (!beh.target || !beh.target.bug.element || !beh.target.bug.element.parentNode) {
                    w.beh = null; w.paused = false; break;
                }
                beh.timer--;
                const tgt = beh.target;
                const tdx = tgt.bug.x - b.x;
                const tdy = tgt.bug.y - b.y;
                const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
                if (tDist > 1) {
                    const step = Math.min(TAG_CHASE_SPEED, tDist);
                    b.x += (tdx / tDist) * step;
                    b.y += (tdy / tDist) * step;
                    w.dir = { dx: Math.sign(tdx) || 1, dy: Math.sign(tdy), name: 'tag' };
                }
                if (tDist < TAG_CATCH_DIST) {
                    spawnSpeechBubble(b.x, b.y, w.size, 'Tag!');
                    beh.rounds--;
                    if (beh.rounds <= 0) {
                        
                        w.beh = null; w.paused = false;
                        if (tgt.beh && tgt.beh.type === 'tag-flee') {
                            tgt.beh = null; tgt.paused = false;
                        }
                    } else {
                        
                        const fleeDir = randDir();
                        w.beh = { type: 'tag-flee', timer: TAG_FLEE_DUR, fleeDir: fleeDir, partner: tgt };
                        w.dir = fleeDir;
                        tgt.beh = { type: 'tag-chase', target: w, timer: TAG_DUR,
                                    rounds: beh.rounds };
                        spawnSpeechBubble(tgt.bug.x, tgt.bug.y, tgt.size, "You're it!");
                    }
                }
                if (beh.timer <= 0) {
                    w.beh = null; w.paused = false;
                    if (tgt.beh && (tgt.beh.type === 'tag-flee' || tgt.beh.type === 'tag-chase')) {
                        tgt.beh = null; tgt.paused = false;
                    }
                }
                break;
            }

            
            case 'tag-flee': {
                beh.timer--;
                const fd = beh.fleeDir;
                b.x += fd.dx * TAG_CHASE_SPEED * 0.85;
                b.y += fd.dy * TAG_CHASE_SPEED * 0.85;
                w.dir = fd;
                
                if (b.x < 0 || b.x + w.size > window.innerWidth) { beh.fleeDir = randDir(); }
                if (b.y < cachedHeaderH || b.y + w.size > window.innerHeight) { beh.fleeDir = randDir(); }
                b.x = Math.max(0, Math.min(window.innerWidth - w.size, b.x));
                b.y = Math.max(cachedHeaderH, Math.min(window.innerHeight - w.size, b.y));
                if (beh.timer <= 0) {
                    
                    w.beh = null; w.paused = false;
                }
                break;
            }

            
            case 'stack-approach': {
                
                if (!beh.targetW || !beh.targetW.bug.element || !beh.targetW.bug.element.parentNode) {
                    w.beh = null; w.paused = false; break;
                }
                beh.timer--;
                
                const tw = beh.targetW;
                const stackRef = tw.beh && tw.beh.stackRef ? tw.beh.stackRef : null;
                const topBug = stackRef ? stackRef.members[stackRef.members.length - 1] : tw;
                const goalX = topBug.bug.x;
                const goalY = topBug.bug.y - w.size;
                const sdx = goalX - b.x;
                const sdy = topBug.bug.y - b.y; 
                const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
                if (sDist > w.size * 0.5) {
                    const step = Math.min(WALK_SPEED * 1.5, sDist);
                    b.x += (sdx / sDist) * step;
                    b.y += (sdy / sDist) * step;
                    w.dir = { dx: Math.sign(sdx) || 1, dy: 0, name: 'stack' };
                } else {
                    
                    w.paused = true;
                    beh.type = 'stack-jump';
                    beh.tick = 0;
                    beh.baseX = b.x;
                    beh.baseY = b.y;
                    beh.goalX = topBug.bug.x;
                    beh.goalY = topBug.bug.y - w.size;
                }
                if (beh.timer <= 0) {
                    w.beh = null; w.paused = false;
                }
                break;
            }

            
            case 'stack-jump': {
                beh.tick++;
                const t = beh.tick / STACK_JUMP_DUR;
                if (t <= 1) {
                    const arc = Math.sin(t * Math.PI) * STACK_HOP_OFF_H;
                    b.x = beh.baseX + (beh.goalX - beh.baseX) * t;
                    b.y = beh.baseY + (beh.goalY - beh.baseY) * t - arc;
                    beh.blend = t; 
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
                } else {
                    
                    b.x = beh.goalX;
                    b.y = beh.goalY;
                    const tw = beh.targetW;
                    let stackRef;
                    if (tw.beh && tw.beh.stackRef) {
                        stackRef = tw.beh.stackRef;
                    } else {
                        
                        stackRef = { members: [tw] };
                        stacks.push(stackRef);
                        tw.paused = true;
                        tw.beh = { type: 'stacked', stackRef: stackRef, stackIndex: 0,
                                   hopTimer: randInt(STACK_SIT_MIN, STACK_SIT_MAX) };
                    }
                    stackRef.members.push(w);
                    w.beh = { type: 'stacked', stackRef: stackRef, stackIndex: stackRef.members.length - 1,
                              hopTimer: randInt(STACK_SIT_MIN, STACK_SIT_MAX) };
                    w.paused = true;
                }
                break;
            }

            
            case 'stacked': {
                beh.hopTimer--;
                const stack = beh.stackRef;
                if (!stack) { w.beh = null; w.paused = false; break; }
                const idx = beh.stackIndex;
                if (idx === 0) {
                    
                    w.paused = false;
                    
                } else {
                    
                    w.paused = true;
                    const below = stack.members[idx - 1];
                    if (below && below.bug.element && below.bug.element.parentNode) {
                        b.x = below.bug.x;
                        b.y = below.bug.y - w.size;
                    }
                }
                if (beh.hopTimer <= 0) {
                    
                    dismountStack(stack, idx);
                }
                break;
            }

            
            case 'stack-hop-off': {
                beh.tick++;
                const t = beh.tick / STACK_JUMP_DUR;
                if (t <= 1) {
                    const arc = Math.sin(t * Math.PI) * STACK_HOP_OFF_H;
                    b.x = beh.baseX + (beh.landX - beh.baseX) * t;
                    b.y = beh.baseY + (beh.landY - beh.baseY) * t - arc;
                    beh.blend = 1 - t;
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
                } else {
                    b.x = beh.landX;
                    b.y = beh.landY;
                    w.beh = null;
                    w.paused = false;
                    w.dir = randDir();
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
                }
                break;
            }
        }
    }

    
    function dismountStack(stack, fromIndex) {
        
        for (let i = stack.members.length - 1; i >= fromIndex; i--) {
            const m = stack.members[i];
            if (!m || !m.bug.element || !m.bug.element.parentNode) continue;
            
            const landX = m.bug.x + (Math.random() - 0.5) * 60;
            const landY = m.bug.y + m.size + 10 + Math.random() * 20;
            m.beh = {
                type: 'stack-hop-off', tick: 0,
                baseX: m.bug.x, baseY: m.bug.y,
                landX: Math.max(0, Math.min(window.innerWidth - m.size, landX)),
                landY: Math.max(cachedHeaderH, Math.min(window.innerHeight - m.size, landY)),
                blend: 1
            };
            m.paused = true;
        }
        
        stack.members.splice(fromIndex);
        
        if (stack.members.length <= 1) {
            if (stack.members.length === 1) {
                const base = stack.members[0];
                if (base.beh && base.beh.type === 'stacked') {
                    base.beh = null;
                    base.paused = false;
                }
            }
            
            const si = stacks.indexOf(stack);
            if (si !== -1) stacks.splice(si, 1);
        }
    }

    
    function walkLoop() {
        if (!enabled) return;

        const playW = window.innerWidth;
        const playH = window.innerHeight;
        const now   = performance.now();

        
        if (walking && activeSmallSize) {
            const bugData = getBugData();
            for (let j = 0; j < bugData.length; j++) {
                const b = bugData[j];
                let found = false;
                for (let k = 0; k < walkers.length; k++) {
                    if (walkers[k].bug === b) { found = true; break; }
                }
                if (found) continue;
                
                const el = b.element;
                savedSizes.push({ bug: b, origWidth: el.style.width, origHeight: el.style.height, origRadius: b.radius });
                el.style.width  = activeSmallSize + 'px';
                el.style.height = activeSmallSize + 'px';
                
                b.radius = Math.round(b.radius * WALK_SCALE);
                b.dx = 0;
                b.dy = 0;

                const legs = createLegsCanvas(activeSmallSize);
                legs.canvas.style.opacity = '1';
                legs.canvas.style.transform = 'scaleY(1)';
                positionLegs(legs, b.x, b.y, activeSmallSize);

                
                if (window.ensureHat && window.hatsEnabled) {
                    window.ensureHat(b);
                }

                walkers.push({
                    bug: b,
                    dir: randDir(),
                    paused: false,
                    tick: Math.floor(Math.random() * 100),
                    legs: legs,
                    size: activeSmallSize,
                    legGrow: 1,
                    held: false,
                    dropping: false,
                    dropVelX: 0,
                    dropVelY: 0,
                    beh: null,
                    behCooldown: BEH_IDLE_MIN + Math.floor(Math.random() * BEH_IDLE_MAX),
                    speedMult: 0.8 + Math.random() * 0.4,
                    convCooldown: 0,
                    swimRot: 0,
                    _oceanSeed: Math.random() * 10
                });
            }
        }

        
        for (let i = walkers.length - 1; i >= 0; i--) {
            const w = walkers[i];
            if (!w.bug.element || !w.bug.element.parentNode) {
                
                if (w.beh && w.beh.type === 'stacked' && w.beh.stackRef) {
                    dismountStack(w.beh.stackRef, w.beh.stackIndex);
                }
                
                if (walkers.length > 1) {
                    spawnRagdollLegs(w);
                }
                w.legs.canvas.remove();
                for (let s = savedSizes.length - 1; s >= 0; s--) {
                    if (savedSizes[s].bug === w.bug) {
                        
                        if (savedSizes[s].origRadius !== undefined) w.bug.radius = savedSizes[s].origRadius;
                        savedSizes.splice(s, 1); break;
                    }
                }
                if (heldWalker === w) heldWalker = null;
                walkers.splice(i, 1);
            }
        }

        
        updateRagdolls(now);

        
        updateOcean(playW, playH);

        for (let i = 0; i < walkers.length; i++) {
            const w = walkers[i];
            const b = w.bug;

            w.tick++;
            if (w.legGrow < 1) w.legGrow = Math.min(1, w.legGrow + 0.02);

            
            if (w.held) {
                if (!w._alienGrabbedBy) {
                    b.x = pointerX + holdOffsetX;
                    b.y = pointerY + holdOffsetY;
                    
                    b.x = Math.max(0, Math.min(playW - w.size, b.x));
                    b.y = Math.max(cachedHeaderH, Math.min(playH - w.size, b.y));
                }
            }
            
            else if (w.dropping) {
                w.dropVelY += DROP_GRAVITY;
                b.x += w.dropVelX;
                b.y += w.dropVelY;

                
                const floor = w.dropFloor;
                if (b.y >= floor) {
                    b.y = floor;
                    w.dropVelY *= -DROP_BOUNCE;
                    w.dropVelX *= DROP_FRICTION;
                    if (Math.abs(w.dropVelY) < DROP_STOP_VEL) {
                        w.dropping = false;
                        b.y = floor;
                        w.dir = randDir();
                    }
                }
                
                if (b.y < cachedHeaderH) {
                    b.y = cachedHeaderH;
                    w.dropVelY = Math.abs(w.dropVelY) * DROP_BOUNCE;
                }
                
                if (b.x < 0) { b.x = 0; w.dropVelX = Math.abs(w.dropVelX) * DROP_BOUNCE; }
                if (b.x + w.size > playW) { b.x = playW - w.size; w.dropVelX = -Math.abs(w.dropVelX) * DROP_BOUNCE; }
            }
            
            else if (walking) {
                
                if (w._inWater) {
                    
                    if (w.beh) w.beh = null;
                    w.paused = false;

                    
                    if (!w._swimVX) { w._swimVX = 0; w._swimVY = 0; }
                    if (!w._swimTick) w._swimTick = 0;
                    w._swimTick++;

                    const cycleLen = 50;
                    const phase = w._swimTick % cycleLen;

                    
                    if (phase === 20) {
                        
                        if (Math.random() < 0.4 || !w._swimDir) {
                            w._swimDir = randSwimDir();
                        }
                        
                        const burstSpeed = 2.5 + Math.random() * 1.5;
                        w._swimVX = w._swimDir.dx * burstSpeed;
                        w._swimVY = w._swimDir.dy * burstSpeed;
                    }

                    
                    w._swimVX *= 0.95;
                    w._swimVY *= 0.95;
                    b.x += w._swimVX;
                    b.y += w._swimVY;

                    
                    const isSwimIdle = Math.abs(w._swimVX) < 0.15 && Math.abs(w._swimVY) < 0.15;
                    w._swimIdle = isSwimIdle;

                    
                    if (b.x < 0)                 { b.x = 0;              w._swimVX = Math.abs(w._swimVX) * 0.3; w._swimDir = randSwimDir(); }
                    if (b.x + w.size > playW)    { b.x = playW - w.size; w._swimVX = -Math.abs(w._swimVX) * 0.3; w._swimDir = randSwimDir(); }
                    if (b.y < cachedHeaderH)      { b.y = cachedHeaderH;  w._swimVY = Math.abs(w._swimVY) * 0.3; w._swimDir = randSwimDir(); }
                    if (b.y + w.size > playH)    { b.y = playH - w.size; w._swimVY = 0; }
                } else {
                    
                    w._swimTick = 0;
                    w._swimVX = 0;
                    w._swimVY = 0;
                    w._swimIdle = false;

                    if (w.convCooldown > 0) w.convCooldown--;

                    
                    w.speedMult += (Math.random() - 0.5) * SPEED_DRIFT * 2;
                    w.speedMult = Math.max(SPEED_MIN, Math.min(SPEED_MAX, w.speedMult));

                    
                    if (w.beh) {
                        updateBehavior(w, playW, playH);
                    } else {
                        pickBehavior(w, walkers);
                    }

                    
                    const isStackBase = w.beh && w.beh.type === 'stacked' && w.beh.stackIndex === 0;
                    if (!w.beh || w.beh.type === 'jump' || isStackBase) {
                        if (!w.paused && !isStackBase && !w.beh && Math.random() < PAUSE_CHANCE)  w.paused = true;
                        else if (w.paused && !isStackBase && !w.beh && Math.random() < UNPAUSE)   { w.paused = false; w.dir = randDir(); }
                        if (!w.paused && (isStackBase || !w.beh) && Math.random() < DIR_CHANGE)    w.dir = randDir();

                        if (!w.paused && (!w.beh || isStackBase)) {
                            const _warpMult = window.__bugSpeedMultiplier || 1;
                            let moveSpeed = WALK_SPEED * w.speedMult * _warpMult;
                            b.x += w.dir.dx * moveSpeed;
                            b.y += w.dir.dy * moveSpeed;

                            if (b.x < 0)                 { b.x = 0;              w.dir = randDir(); }
                            if (b.x + w.size > playW)    { b.x = playW - w.size; w.dir = randDir(); }
                            if (b.y < cachedHeaderH)      { b.y = cachedHeaderH;  w.dir = randDir(); }
                            if (b.y + w.size > playH)    { b.y = playH - w.size; w.dir = randDir(); }
                        }
                    }
                }
            }

            b.dx = 0;
            b.dy = 0;

            
            applyWaterPhysics(w, playH);

            
            const selfTransform = w.beh && (
                w.beh.type === 'sit' || w.beh.type === 'sleep' || w.beh.type === 'jump' ||
                w.beh.type === 'trip' || w.beh.type === 'dance' ||
                w.beh.type === 'stack-jump' || w.beh.type === 'stack-hop-off'
            );
            if (!selfTransform) {
                const swimDeg = w.swimRot || 0;
                if (swimDeg) {
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${swimDeg}deg)`;
                } else {
                    b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
                }
            }

            
            if (b.hat) {
                b.hat.style.left = `${b.x + w.size / 2}px`;
                b.hat.style.top  = `${b.y - w.size / 2 + (50 * w.size / 75)}px`;
                b.hat.style.transform = 'translate(-50%, -100%)';
                b.hat.style.width  = `${50 * w.size / 75}px`;
                b.hat.style.height = `${50 * w.size / 75}px`;
            }
            if (b.horns && window.updateHornAttachment) {
                window.updateHornAttachment(b, w.size);
            }

            
            const depth = w.held ? 10000 : Math.round(b.y);
            b.element.style.zIndex = depth;
            w.legs.canvas.style.zIndex = depth;

            positionLegs(w.legs, b.x, b.y, w.size, w.swimRot);
            
            if (w.beh && w.beh.type === 'dance' && w.beh.bounceOff) {
                w.legs.canvas.style.top = (b.y - w.beh.bounceOff + w.size - 2) + 'px';
            }
            const behState = w.beh || null;
            const isStationary = behState && (behState.type === 'converse-speak' || behState.type === 'wave' || behState.type === 'wave-back');
            const idle = w._inWater
                ? !!(w._swimIdle)
                : ((w.paused && !behState) || isStationary || !walking || w.dropping);
            const isSwimming = !!(w._inWater);
            drawLegs(w.legs, w.size, w._inWater ? (w._swimTick || w.tick) : w.tick, w.dir, idle, w.legGrow, w.held, behState, isSwimming);
        }

        
        updateAlienShips();

        rafId = requestAnimationFrame(walkLoop);
    }

    
    function createOceanDOM() {
        if (!container) container = document.querySelector('.bugs-container') || document.body;

        
        oceanWaterEl = document.createElement('div');
        oceanWaterEl.className = 'ocean-water';
        oceanWaterEl.style.height = '0px';
        document.body.appendChild(oceanWaterEl);

        oceanCanvas = document.createElement('canvas');
        oceanCanvas.className = 'ocean-water-canvas';
        oceanWaterEl.appendChild(oceanCanvas);
        oceanCtx = oceanCanvas.getContext('2d');

        
        oceanDrainEl = null;

        
        
        oceanPlugEl = document.createElement('div');
        oceanPlugEl.className = 'ocean-plug';
        oceanPlugEl.innerHTML = '<div class="ocean-plug-cap"></div><div class="ocean-plug-body"></div>';
        plugAnchorX = window.innerWidth / 2;
        plugAnchorY = window.innerHeight;
        plugX = plugAnchorX;
        plugY = plugAnchorY;  
        plugFree = false;
        plugVelX = 0;
        plugVelY = 0;
        positionPlug();
        document.body.appendChild(oceanPlugEl);

        
        oceanChainCvs = document.createElement('canvas');
        oceanChainCvs.className = 'ocean-chain-canvas';
        oceanChainCvs.width  = window.innerWidth;
        oceanChainCvs.height = window.innerHeight;
        document.body.appendChild(oceanChainCvs);
        oceanChainCtx = oceanChainCvs.getContext('2d');

        
        chainBalls = [];
        const capY = plugY - PLUG_CAP_HEIGHT;
        for (let i = 0; i < CHAIN_BALLS; i++) {
            
            const x = plugX + (Math.random() - 0.5) * 2;
            const y = capY - BALL_RADIUS - i * 0.5; 
            chainBalls.push({ x: x, y: y, ox: x, oy: y });
        }

        
        chainGrabEl = document.createElement('div');
        chainGrabEl.className = 'ocean-chain-grab';
        const chainH = CHAIN_BALLS * CHAIN_LINK_LEN + 40;
        chainGrabEl.style.width = (BALL_RADIUS * 4 + 40) + 'px';
        chainGrabEl.style.height = chainH + 'px';
        chainGrabEl.style.left = (plugX - BALL_RADIUS * 2 - 20) + 'px';
        chainGrabEl.style.top = (capY - chainH) + 'px';
        document.body.appendChild(chainGrabEl);
        chainGrabIdx = -1;

        
        chainGrabEl.addEventListener('pointerdown', onChainGrabDown, { passive: false });
        chainGrabEl.addEventListener('lostpointercapture', onChainGrabUp, { passive: false });
        document.addEventListener('pointermove', onChainGrabMove, { passive: false });
        document.addEventListener('pointerup',   onChainGrabUp,   { passive: false });
        document.addEventListener('pointercancel', onChainGrabUp, { passive: false });
    }

    function destroyOceanDOM() {
        if (oceanWaterEl)  { oceanWaterEl.remove();  oceanWaterEl = null; }
        if (oceanDrainEl)  { oceanDrainEl.remove();  oceanDrainEl = null; }
        if (oceanPlugEl)   { oceanPlugEl.remove();   oceanPlugEl = null;  }
        if (chainGrabEl)   {
            chainGrabEl.removeEventListener('pointerdown', onChainGrabDown);
            chainGrabEl.removeEventListener('lostpointercapture', onChainGrabUp);
            chainGrabEl.remove();
            chainGrabEl = null;
        }
        if (oceanChainCvs) { oceanChainCvs.remove(); oceanChainCvs = null; }
        document.removeEventListener('pointermove', onChainGrabMove);
        document.removeEventListener('pointerup',   onChainGrabUp);
        document.removeEventListener('pointercancel', onChainGrabUp);
        oceanCanvas = null; oceanCtx = null; oceanChainCtx = null;
        chainBalls = [];
        chainGrabIdx = -1;
        waterBubbles.length = 0;
    }

    
    function onChainGrabDown(e) {
        if (plugPulled || plugFade || plugFree) return;
        e.preventDefault();
        e.stopPropagation();

        
        chainGrabIdx = CHAIN_BALLS - 1;
        plugGrabbed = true;
        const b = chainBalls[chainGrabIdx];
        plugGrabOff.x = b.x - e.clientX;
        plugGrabOff.y = b.y - e.clientY;
        chainMouseTarget.x = e.clientX + plugGrabOff.x;
        chainMouseTarget.y = e.clientY + plugGrabOff.y;
        if (typeof chainGrabEl.setPointerCapture === 'function' && e.pointerId != null) {
            chainGrabEl.setPointerCapture(e.pointerId);
        }
    }

    function onChainGrabMove(e) {
        if (!plugGrabbed || chainGrabIdx < 0) return;
        e.preventDefault();
        
        chainMouseTarget.x = e.clientX + plugGrabOff.x;
        chainMouseTarget.y = e.clientY + plugGrabOff.y;
    }

    function onChainGrabUp(e) {
        if (!plugGrabbed) return;
        if (chainGrabEl && typeof chainGrabEl.releasePointerCapture === 'function' && e && e.pointerId != null) {
            try { chainGrabEl.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        plugGrabbed = false;
        chainGrabIdx = -1;
    }

    function popPlugFree() {
        plugPulled = true;
        plugGrabbed = false;
        plugFree = true;
        chainGrabIdx = -1;
        plugVelX = (Math.random() - 0.5) * 3;
        plugVelY = -8;
        oceanDraining = true;
        
        if (oceanPlugEl) oceanPlugEl.style.overflow = 'visible';
    }

    function positionPlug() {
        if (!oceanPlugEl) return;
        
        
        
        oceanPlugEl.style.left = (plugX - PLUG_WIDTH / 2) + 'px';
        oceanPlugEl.style.top  = (plugY - PLUG_CAP_HEIGHT) + 'px';
    }
    
    function updateFreePlug(playH) {
        if (!plugFree || !oceanPlugEl) return;
        plugVelY += PLUG_GRAVITY;
        plugX += plugVelX;
        plugY += plugVelY;

        const halfW = PLUG_WIDTH / 2;
        if (plugY > playH - 10) {
            plugY = playH - 10;
            plugVelY *= -PLUG_BOUNCE;
            plugVelX *= 0.7;
            if (Math.abs(plugVelY) < 1) plugVelY = 0;
        }
        if (plugX < halfW) { plugX = halfW; plugVelX = Math.abs(plugVelX) * PLUG_BOUNCE; }
        if (plugX > window.innerWidth - halfW) { plugX = window.innerWidth - halfW; plugVelX = -Math.abs(plugVelX) * PLUG_BOUNCE; }

        if (oceanLevel > 0) {
            const waterSurf = playH - oceanLevel;
            if (plugY > waterSurf) {
                plugVelX *= 0.96;
                plugVelY *= 0.96;
            }
        }

        positionPlug();

        if (!plugFade && oceanDraining) {
            const speed = Math.sqrt(plugVelX * plugVelX + plugVelY * plugVelY);
            if (speed < 0.5) {
                plugFade = true;
                oceanPlugEl.style.transition = 'opacity 0.6s';
                oceanPlugEl.style.opacity = '0';
            }
        }
    }

    
    function drawChain() {
        if (!oceanChainCtx || chainBalls.length === 0) return;
        const ctx = oceanChainCtx;
        const cw = oceanChainCvs.width;
        const ch = oceanChainCvs.height;
        ctx.clearRect(0, 0, cw, ch);

        if (plugFree) return;

        const capY = plugY - PLUG_CAP_HEIGHT;
        const gravity = 0.5;
        const damping = 0.98;

        
        for (let i = 1; i < CHAIN_BALLS; i++) {
            const p = chainBalls[i];
            const vx = (p.x - p.ox) * damping;
            const vy = (p.y - p.oy) * damping + gravity;
            p.ox = p.x;
            p.oy = p.y;
            p.x += vx;
            p.y += vy;

            
            if (oceanActive && oceanLevel > 0) {
                const waterSurf = ch - oceanLevel;
                if (p.y > waterSurf) {
                    p.y -= 0.35;
                    p.x += Math.sin(oceanTick * 0.02 + i * 0.5) * 0.12;
                }
            }
        }

        
        if (plugGrabbed && chainGrabIdx >= 0) {
            const g = chainBalls[chainGrabIdx];
            
            g.x = chainMouseTarget.x;
            g.y = chainMouseTarget.y;
            g.ox = g.x;
            g.oy = g.y;
        }

        
        for (let iter = 0; iter < CHAIN_ITER; iter++) {
            
            chainBalls[0].x = plugX;
            chainBalls[0].y = capY - BALL_RADIUS;

            
            
            for (let i = 0; i < CHAIN_BALLS - 1; i++) {
                const a = chainBalls[i];
                const b = chainBalls[i + 1];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 0.001) continue;
                const diff = (d - CHAIN_LINK_LEN) / d;
                const cx = dx * diff * 0.5;
                const cy = dy * diff * 0.5;
                if (i === 0) {
                    
                    b.x -= cx * 2;
                    b.y -= cy * 2;
                } else {
                    a.x += cx;
                    a.y += cy;
                    b.x -= cx;
                    b.y -= cy;
                }
            }

            
            chainBalls[0].x = plugX;
            chainBalls[0].y = capY - BALL_RADIUS;
        }

        
        for (let i = 1; i < CHAIN_BALLS; i++) {
            const p = chainBalls[i];
            if (p.y > ch - BALL_RADIUS) p.y = ch - BALL_RADIUS;
            if (p.x < BALL_RADIUS) p.x = BALL_RADIUS;
            if (p.x > cw - BALL_RADIUS) p.x = cw - BALL_RADIUS;
        }

        
        
        
        if (plugGrabbed && !plugFree) {
            const mouseDx = chainMouseTarget.x - plugX;
            const mouseDy = chainMouseTarget.y - plugY;
            const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
            const maxReach = (CHAIN_BALLS - 1) * CHAIN_LINK_LEN;
            const pullAssist = IS_COARSE_POINTER ? 2.4 : 1;

            
            if (mouseDy < -2) {
                const distRatio = mouseDist / maxReach;
                
                if (distRatio > 1.0) {
                    
                    const overstretch = distRatio - 1.0;
                    
                    
                    let pullSpeed;
                    if (overstretch < 1.5) {
                        
                        pullSpeed = overstretch * 0.00012;
                    } else {
                        
                        const rip = overstretch - 1.5;
                        pullSpeed = 0.00018 + rip * rip * 0.006;
                    }
                    plugProgress = Math.min(1, plugProgress + pullSpeed * pullAssist);
                    plugX = plugAnchorX;
                    plugY = plugAnchorY - plugProgress * PLUG_POP_DIST;
                    positionPlug();

                    if (plugProgress >= 1) {
                        popPlugFree();
                    }
                }
            }
        } else if (!plugGrabbed && !plugFree && plugProgress > 0) {
            
            plugProgress = Math.max(0, plugProgress - (IS_COARSE_POINTER ? 0.0025 : 0.005));
            plugX = plugAnchorX;
            plugY = plugAnchorY - plugProgress * PLUG_POP_DIST;
            positionPlug();
        }

        
        
        for (let i = 0; i < CHAIN_BALLS; i++) {
            const b = chainBalls[i];
            const isGrabbed = plugGrabbed && i === chainGrabIdx;

            
            const grad = ctx.createRadialGradient(
                b.x - BALL_RADIUS * 0.3, b.y - BALL_RADIUS * 0.3, BALL_RADIUS * 0.1,
                b.x, b.y, BALL_RADIUS
            );
            grad.addColorStop(0, isGrabbed ? '#fff' : '#d0d0d0');
            grad.addColorStop(0.6, isGrabbed ? '#ccc' : '#a0a0a0');
            grad.addColorStop(1, '#707070');

            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        
        if (chainGrabEl && chainBalls.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < chainBalls.length; i++) {
                const p = chainBalls[i];
                if (p.x - BALL_RADIUS < minX) minX = p.x - BALL_RADIUS;
                if (p.y - BALL_RADIUS < minY) minY = p.y - BALL_RADIUS;
                if (p.x + BALL_RADIUS > maxX) maxX = p.x + BALL_RADIUS;
                if (p.y + BALL_RADIUS > maxY) maxY = p.y + BALL_RADIUS;
            }
            const pad = 15;
            chainGrabEl.style.left = (minX - pad) + 'px';
            chainGrabEl.style.top  = (minY - pad) + 'px';
            chainGrabEl.style.width = (maxX - minX + pad * 2) + 'px';
            chainGrabEl.style.height = (maxY - minY + pad * 2) + 'px';
        }
    }

    
    let waterBubbles = [];
    const MAX_BUBBLES = 40;

    function spawnBubble(cw, ch, surfY) {
        waterBubbles.push({
            x: Math.random() * cw,
            y: ch - Math.random() * 20,  
            r: 1.5 + Math.random() * 3,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -(0.3 + Math.random() * 0.8),
            wobble: Math.random() * Math.PI * 2,
            alpha: 0.2 + Math.random() * 0.3
        });
    }

    
    function drawWater() {
        if (!oceanCtx || oceanLevel <= 0) return;

        const cw = window.innerWidth;
        const ch = Math.ceil(oceanLevel) + OCEAN_WAVE_AMP + 4;
        if (oceanCanvas.width !== cw || oceanCanvas.height !== ch) {
            oceanCanvas.width  = cw;
            oceanCanvas.height = ch;
        }
        oceanWaterEl.style.height = ch + 'px';

        const ctx = oceanCtx;
        const t = oceanTick;
        ctx.clearRect(0, 0, cw, ch);

        
        const waveY = new Float32Array(Math.ceil(cw / 2) + 1);
        for (let i = 0, x = 0; x <= cw; x += 2, i++) {
            waveY[i] = Math.sin(t * OCEAN_WAVE_SPEED + x * OCEAN_WAVE_LEN) * OCEAN_WAVE_AMP
                      + Math.sin(t * OCEAN_WAVE_SPEED * 1.6 + x * OCEAN_WAVE_LEN * 0.7) * (OCEAN_WAVE_AMP * 0.4)
                      + Math.sin(t * OCEAN_WAVE_SPEED * 0.5 + x * OCEAN_WAVE_LEN * 1.8) * (OCEAN_WAVE_AMP * 0.2);
        }
        function getSurfY(x) {
            const i = Math.max(0, Math.min(waveY.length - 1, Math.round(x / 2)));
            return ch - oceanLevel + waveY[i];
        }

        
        ctx.beginPath();
        ctx.moveTo(0, ch);
        for (let x = 0; x <= cw; x += 2) ctx.lineTo(x, getSurfY(x));
        ctx.lineTo(cw, ch);
        ctx.closePath();
        ctx.save();
        ctx.clip();

        
        const bodyGrad = ctx.createLinearGradient(0, ch - oceanLevel - OCEAN_WAVE_AMP, 0, ch);
        bodyGrad.addColorStop(0,    'rgba(40, 140, 220, 0.35)');
        bodyGrad.addColorStop(0.15, 'rgba(30, 110, 200, 0.45)');
        bodyGrad.addColorStop(0.4,  'rgba(20, 80, 170, 0.55)');
        bodyGrad.addColorStop(0.7,  'rgba(12, 55, 130, 0.62)');
        bodyGrad.addColorStop(1,    'rgba(6, 30, 80, 0.70)');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(0, 0, cw, ch);

        
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.05;
        const causticCount = 20;
        for (let i = 0; i < causticCount; i++) {
            const cx = (Math.sin(t * 0.009 + i * 1.9) * 0.6 + 0.5) * cw;
            const cy = ch - oceanLevel * (0.15 + Math.sin(t * 0.007 + i * 2.3) * 0.3) + OCEAN_WAVE_AMP + 10;
            const pulse = Math.sin(t * 0.025 + i * 1.5);
            const rx = 20 + pulse * 12;
            const ry = 14 + pulse * 8;
            const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
            cGrad.addColorStop(0, 'rgba(170, 225, 255, 1)');
            cGrad.addColorStop(0.6, 'rgba(130, 200, 250, 0.3)');
            cGrad.addColorStop(1, 'rgba(100, 180, 240, 0)');
            ctx.fillStyle = cGrad;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, t * 0.003 + i, 0, Math.PI * 2);
            ctx.fill();
        }

        
        ctx.globalAlpha = 1;
        const rayCount = 5;
        for (let i = 0; i < rayCount; i++) {
            const phase = t * 0.008 + i * 1.3;
            const baseX = (Math.sin(phase) * 0.5 + 0.5) * cw;
            const surfTop = getSurfY(baseX);
            const spread = 30 + Math.sin(t * 0.012 + i * 2.5) * 15;
            const rayLen = oceanLevel * (0.5 + Math.sin(t * 0.015 + i) * 0.2);
            const rayAlpha = 0.04 + Math.sin(t * 0.02 + i * 1.8) * 0.02;

            const rayGrad = ctx.createLinearGradient(baseX, surfTop, baseX + spread * 0.3, surfTop + rayLen);
            rayGrad.addColorStop(0,   `rgba(180, 220, 255, ${rayAlpha})`);
            rayGrad.addColorStop(0.5, `rgba(140, 200, 245, ${rayAlpha * 0.5})`);
            rayGrad.addColorStop(1,   'rgba(100, 180, 240, 0)');

            ctx.beginPath();
            ctx.moveTo(baseX - spread * 0.15, surfTop);
            ctx.lineTo(baseX + spread * 0.15, surfTop);
            ctx.lineTo(baseX + spread, surfTop + rayLen);
            ctx.lineTo(baseX - spread * 0.6, surfTop + rayLen);
            ctx.closePath();
            ctx.fillStyle = rayGrad;
            ctx.fill();
        }

        
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 18; i++) {
            const cx = (Math.sin(t * 0.011 + i * 2.1) * 0.5 + 0.5) * cw;
            const cy = ch - oceanLevel * (0.2 + Math.sin(t * 0.014 + i) * 0.25) + OCEAN_WAVE_AMP;
            const pulsate = Math.sin(t * 0.04 + i * 1.3);
            const r  = 10 + pulsate * 6;
            const alpha = 0.06 + pulsate * 0.03;
            const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            cGrad.addColorStop(0, `rgba(180, 230, 255, ${alpha})`);
            cGrad.addColorStop(0.5, `rgba(140, 210, 250, ${alpha * 0.4})`);
            cGrad.addColorStop(1, 'rgba(100, 190, 240, 0)');
            ctx.fillStyle = cGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        
        ctx.globalCompositeOperation = 'source-over';
        
        if (waterBubbles.length < MAX_BUBBLES && Math.random() < 0.15) {
            spawnBubble(cw, ch, ch - oceanLevel);
        }
        
        for (let i = waterBubbles.length - 1; i >= 0; i--) {
            const bub = waterBubbles[i];
            bub.wobble += 0.06;
            bub.x += bub.vx + Math.sin(bub.wobble) * 0.4;
            bub.y += bub.vy;
            bub.alpha -= 0.002;

            const surfHere = getSurfY(bub.x);
            if (bub.y < surfHere || bub.alpha <= 0) {
                waterBubbles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = bub.alpha;
            
            const bubGrad = ctx.createRadialGradient(
                bub.x - bub.r * 0.3, bub.y - bub.r * 0.3, bub.r * 0.1,
                bub.x, bub.y, bub.r
            );
            bubGrad.addColorStop(0, 'rgba(200, 235, 255, 0.6)');
            bubGrad.addColorStop(0.7, 'rgba(140, 200, 240, 0.15)');
            bubGrad.addColorStop(1, 'rgba(100, 180, 230, 0)');
            ctx.fillStyle = bubGrad;
            ctx.beginPath();
            ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = bub.alpha * 0.8;
            ctx.fillStyle = 'rgba(230, 245, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(bub.x - bub.r * 0.25, bub.y - bub.r * 0.25, bub.r * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.restore(); 

        
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 3;
        for (let pass = 0; pass < 2; pass++) {
            const offset = pass * 1.5;
            const alpha = pass === 0 ? 0.5 : 0.25;
            ctx.beginPath();
            for (let x = 0; x <= cw; x += 2) {
                const sy = getSurfY(x) + offset;
                if (x === 0) ctx.moveTo(x, sy);
                else ctx.lineTo(x, sy);
            }
            ctx.strokeStyle = `rgba(200, 235, 255, ${alpha})`;
            ctx.lineWidth = pass === 0 ? 2.5 : 1.5;
            ctx.stroke();
        }

        
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.12;
        for (let x = 0; x < cw; x += 6) {
            const sy = getSurfY(x);
            const shimmer = Math.sin(t * 0.06 + x * 0.08) * 0.5 + 0.5;
            if (shimmer > 0.7) {
                const sw = 3 + shimmer * 4;
                ctx.fillStyle = 'rgba(220, 245, 255, 1)';
                ctx.fillRect(x, sy - 1, sw, 2);
            }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    
    function updateOcean(playW, playH) {
        if (!oceanActive) return;
        oceanTick++;

        const maxH = playH * OCEAN_MAX_FRAC;

        if (!oceanDraining && !plugPulled) {
            
            if (oceanLevel < maxH) {
                oceanLevel = Math.min(maxH, oceanLevel + OCEAN_RISE_SPEED);
            }

            
            
            if (!plugFree && plugProgress > 0) {
                const visibleHeight = plugAnchorY - plugY;
                if (visibleHeight >= PLUG_CORK_HEIGHT) {
                    popPlugFree();
                }
            }
        } else if (oceanDraining) {
            
            oceanLevel = Math.max(0, oceanLevel - OCEAN_DRAIN_SPEED);
            if (oceanLevel <= 0) {
                oceanLevel = 0;
                oceanDraining = false;
                
                plugFade = true;
                if (oceanPlugEl)  oceanPlugEl.style.opacity  = '0';
                if (oceanDrainEl) oceanDrainEl.style.opacity = '0';
                if (chainGrabEl)  chainGrabEl.style.display  = 'none';
                setTimeout(function () {
                    destroyOceanDOM();
                    stopOceanLoop();
                    oceanActive = false;
                    plugPulled = false;
                    plugFade = false;
                    plugHeld = false;
                    plugFree = false;
                    plugGrabbed = false;
                    plugProgress = 0;
                    plugPullTime = 0;
                    chainEndX = 0;
                    chainEndY = 0;
                    oceanLevel = 0;
                    
                    var bugData = getBugData();
                    for (var ri = 0; ri < bugData.length; ri++) {
                        var rb = bugData[ri];
                        rb.element.style.transform = 'translate3d(' + rb.x + 'px, ' + rb.y + 'px, 0)';
                    }
                    for (var wi = 0; wi < walkers.length; wi++) {
                        walkers[wi].swimRot = 0;
                        walkers[wi]._inWater = false;
                        walkers[wi]._swimVX = 0;
                        walkers[wi]._swimVY = 0;
                        walkers[wi]._swimTick = 0;
                        walkers[wi]._swimDir = null;
                    }
                    var btn = document.getElementById('ocean-btn');
                    if (btn) btn.textContent = 'Ocean';
                }, 650);
                return;
            }
        }

        drawWater();
        drawChain();
        updateFreePlug(playH);

        
        if (!plugGrabbed && !plugPulled && !plugFree && plugProgress > 0) {
            plugProgress = Math.max(0, plugProgress - 0.003);
            plugX = plugAnchorX;
            plugY = plugAnchorY - plugProgress * PLUG_POP_DIST;
            positionPlug();
        }
    }

    
    function applyWaterPhysics(w, playH) {
        if (!oceanActive || oceanLevel <= 0) return;
        const b = w.bug;
        const bugBottom = b.y + w.size;
        const waterSurface = playH - oceanLevel;

        
        const submerged = bugBottom - waterSurface;
        if (submerged <= 0) {
            w.swimRot = 0;
            w._inWater = false;
            return;
        }
        w._inWater = true;

        const depthFrac = Math.min(1, submerged / w.size);

        
        if (w.dropping) {
            w.dropVelX *= OCEAN_DRAG;
            w.dropVelY *= OCEAN_DRAG;
        }

        
        for (let j = 0; j < walkers.length; j++) {
            const other = walkers[j];
            if (other === w || other.held) continue;
            const ob = other.bug;
            const dx = b.x - ob.x;
            const dy = b.y - ob.y;
            const distSq = dx * dx + dy * dy;
            const minDist = w.size * 1.1;
            if (distSq < minDist * minDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const push = (minDist - dist) * 0.05;
                b.x += (dx / dist) * push;
                b.y += (dy / dist) * push;
            }
        }

        
        if (b.y + w.size > playH) b.y = playH - w.size;

        
        if (w._swimVX !== undefined && w._swimVY !== undefined) {
            const speed = Math.sqrt(w._swimVX * w._swimVX + w._swimVY * w._swimVY);
            if (speed > 0.15) {
                
                const targetDeg = Math.atan2(w._swimVX, -w._swimVY) * (180 / Math.PI);
                let diff = targetDeg - (w.swimRot || 0);
                
                while (diff > 180) diff -= 360;
                while (diff < -180) diff += 360;
                w.swimRot = (w.swimRot || 0) + diff * 0.06;
            }
            
            else if (w.swimRot) {
                w.swimRot *= 0.95;
                if (Math.abs(w.swimRot) < 0.5) w.swimRot = 0;
            }
        } else {
            w.swimRot = 0;
        }
    }

    
    function applyWaterPhysicsRaw(b, playH, seed) {
        if (!oceanActive || oceanLevel <= 0) {
            
            if (b._waterVX !== undefined) { b._waterVX = 0; b._waterVY = 0; }
            return;
        }
        const size = parseInt(b.element.style.width) || 75;
        const bugBottom = b.y + size;
        const waterSurface = playH - oceanLevel;

        const submerged = bugBottom - waterSurface;
        if (submerged <= 0) {
            if (b._waterVX !== undefined) { b._waterVX = 0; b._waterVY = 0; }
            b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
            return;
        }

        
        if (b._waterVX === undefined) { b._waterVX = 0; b._waterVY = 0; }

        const depthFrac = Math.min(1, submerged / size);

        
        b._waterVY -= WATER_BUOYANCY * depthFrac;

        
        b._waterVX += Math.cos(oceanTick * 0.02 + b.y * 0.005 + seed) * WATER_CURRENT * depthFrac;

        
        if (Math.random() < 0.02) {
            b._waterVX += (Math.random() - 0.5) * WATER_IMPULSE;
            b._waterVY += (Math.random() - 0.5) * WATER_IMPULSE * 0.6;
        }

        
        b._waterVX *= OCEAN_DRAG;
        b._waterVY *= OCEAN_DRAG;

        
        if (submerged < size * 0.3) {
            b._waterVY *= 0.85;
            b._waterVY += Math.sin(oceanTick * 0.05 + seed) * WATER_BOB_AMP * 0.1;
        }

        
        b.x += b._waterVX;
        b.y += b._waterVY;

        
        const playW = window.innerWidth;
        if (b.x < 0)              { b.x = 0;            b._waterVX = Math.abs(b._waterVX) * 0.5; }
        if (b.x + size > playW)   { b.x = playW - size; b._waterVX = -Math.abs(b._waterVX) * 0.5; }
        if (b.y + size > playH)   { b.y = playH - size; b._waterVY = 0; }

        
        b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;

        
        b.dx = 0;
        b.dy = 0;
    }

    
    function toggleOcean() {
        if (oceanActive && !oceanDraining && !plugFade) {
            
            popPlugFree();
            return false;
        }
        if (oceanActive) return oceanActive; 

        
        oceanActive = true;
        oceanDraining = false;
        oceanLevel = 0;
        oceanTick = 0;
        plugPulled = false;
        plugFade = false;
        plugHeld = false;
        plugFree = false;
        plugGrabbed = false;
        plugProgress = 0;
        plugVelX = 0;
        plugVelY = 0;
        chainEndX = 0;
        chainEndY = 0;
        createOceanDOM();

        
        if (!enabled) {
            startOceanLoop();
        }
        return true;
    }

    
    function startOceanLoop() {
        if (oceanRafId) return;
        function loop() {
            if (!oceanActive) { oceanRafId = null; return; }
            const playW = window.innerWidth;
            const playH = window.innerHeight;

            updateOcean(playW, playH);

            
            const bugData = getBugData();
            for (let i = 0; i < bugData.length; i++) {
                applyWaterPhysicsRaw(bugData[i], playH, i * 1.7);
            }
            
            for (let i = 0; i < bugData.length; i++) {
                const a = bugData[i];
                const sizeA = parseInt(a.element.style.width) || 75;
                for (let j = i + 1; j < bugData.length; j++) {
                    const bObj = bugData[j];
                    const sizeB = parseInt(bObj.element.style.width) || 75;
                    const dx = a.x - bObj.x;
                    const dy = a.y - bObj.y;
                    const distSq = dx * dx + dy * dy;
                    const minD = (sizeA + sizeB) * 0.55;
                    if (distSq < minD * minD && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const push = (minD - dist) * 0.03;
                        const nx = dx / dist, ny = dy / dist;
                        a.x += nx * push;    a.y += ny * push;
                        bObj.x -= nx * push; bObj.y -= ny * push;
                    }
                }
                a.element.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
            }

            oceanRafId = requestAnimationFrame(loop);
        }
        oceanRafId = requestAnimationFrame(loop);
    }

    function stopOceanLoop() {
        if (oceanRafId) { cancelAnimationFrame(oceanRafId); oceanRafId = null; }
    }

    
    


    const ALIEN_EVENT_DUR   = 30000;
    const ALIEN_SHIP_SIZE   = 60;
    const ALIEN_SPAWN_INT   = 2500;
    const ALIEN_MAX_SHIPS   = 6;
    const ALIEN_FLY_SPEED   = 2.5;
    const BEAM_WIDTH        = 40;
    const BEAM_SUCK_SPEED   = 3.5;
    const LASER_DUR         = 50;
    const LASER_WIDTH       = 4;
    const ARM_SEG_LEN       = 40;
    const CLAW_RADIUS       = 14;
    const ATTACK_TIMEOUT    = 300;
    const GRAB_HOLD_MIN     = 480;
    const GRAB_HOLD_MAX     = 900;
    const TUG_TAUT_FRAMES   = 60;
    const TUG_MAX_DIST      = 120;
    const TUG_SHIP_PULL     = 0.08;
    const TUG_USER_PULL     = 0.12;
    const SHIP_BRACE_FORCE  = 0.4;
    const TUG_WAR_CHANCE    = 0.001;
    const SPIN_ACCEL        = 0.002;
    const SPIN_MAX          = 0.18;
    const WINDUP_TICKS      = 30;
    const THROW_FORCE       = 22;
    const GATLING_BURST     = 16;
    const GATLING_INTERVAL  = 3;
    const GATLING_SPEED     = 14;
    const GATLING_BOLT_R    = 3;
    const GATLING_BOLT_LEN  = 14;
    const GATLING_KB        = 10;
    const BOMB_COUNT        = 3;
    const BOMB_INTERVAL     = 25;
    const BOMB_GRAVITY      = 0.18;
    const BOMB_LAUNCH_SPEED = 9;
    const BOMB_SCALE        = 0.8;
    const BOMB_BLAST_R      = 100;
    const BOMB_LAUNCH_V     = 30;

    let alienActive = false;
    let alienShips = [];
    let alienTimer = null;
    let alienSpawnTimer = null;
    let alienCanvas = null;
    let alienCtx = null;
    let alienCleanupTimer = null;
    let alienPseudoWalkers = [];
    let alienRafId = null;
    let alienBolts = [];
    let alienBombs = [];
    let alienUserPulling = false;
    let alienUserTarget = null;
    let alienUserPX = 0;
    let alienUserPY = 0;

    function buildPseudoWalkers() {
        alienPseudoWalkers = [];
        if (!window.BugSim) return;
        var bugData = window.BugSim.getBugData();
        if (!bugData) return;
        for (var i = 0; i < bugData.length; i++) {
            var b = bugData[i];
            alienPseudoWalkers.push({
                bug: b,
                get size() { return this.bug.radius * 2; },
                set size(v) { this.bug.radius = v / 2; },
                held: false,
                dropping: false,
                paused: false,
                beh: null,
                legs: null,
                dir: 1,
                speedMult: 1,
                dropVelX: 0,
                dropVelY: 0,
                dropFloor: 0,
                tick: 0,
                _isBugSim: true,
                _savedDx: 0,
                _savedDy: 0,
                _alienGrabbedBy: null
            });
        }
    }

    function getAlienTargetList() {
        if (enabled && walkers.length > 0) return walkers;
        return alienPseudoWalkers;
    }

    function alienAnimLoop() {
        if (!alienActive && alienShips.length === 0 && alienBolts.length === 0 && alienBombs.length === 0) {
            alienRafId = null;
            alienPseudoWalkers = [];
            return;
        }
        for (var i = 0; i < alienPseudoWalkers.length; i++) {
            var pw = alienPseudoWalkers[i];
            if (pw.paused || pw.held) {
                pw.bug.dx = 0;
                pw.bug.dy = 0;
            }
        }
        updateAlienShips();
        for (var i = 0; i < alienPseudoWalkers.length; i++) {
            var pw = alienPseudoWalkers[i];
            if (pw.paused || pw.held) {
                pw.bug.element.style.transform = 'translate3d(' + pw.bug.x + 'px, ' + pw.bug.y + 'px, 0)';
            }
        }
        alienRafId = requestAnimationFrame(alienAnimLoop);
    }

    
    function onAlienPointerDown(e) {
        for (var i = 0; i < alienShips.length; i++) {
            var s = alienShips[i];
            if (s.state !== 'arm_hold') continue;
            var tw = s.target;
            if (!tw) continue;
            var bx = tw.bug.x + tw.size / 2;
            var by = tw.bug.y + tw.size / 2;
            var ddx = e.clientX - bx;
            var ddy = e.clientY - by;
            if (Math.sqrt(ddx * ddx + ddy * ddy) < Math.max(tw.size * 2, 60)) {
                alienUserPulling = true;
                alienUserTarget = tw;
                alienUserPX = e.clientX;
                alienUserPY = e.clientY;
                e.preventDefault();
                return;
            }
        }
    }
    function onAlienPointerMove(e) {
        if (!alienUserPulling) return;
        alienUserPX = e.clientX;
        alienUserPY = e.clientY;
    }
    function onAlienPointerUp() {
        alienUserPulling = false;
        alienUserTarget = null;
    }
    function bindAlienPointer() {
        document.addEventListener('pointerdown', onAlienPointerDown, true);
        document.addEventListener('pointermove', onAlienPointerMove, true);
        document.addEventListener('pointerup', onAlienPointerUp, true);
        document.addEventListener('pointercancel', onAlienPointerUp, true);
    }
    function unbindAlienPointer() {
        document.removeEventListener('pointerdown', onAlienPointerDown, true);
        document.removeEventListener('pointermove', onAlienPointerMove, true);
        document.removeEventListener('pointerup', onAlienPointerUp, true);
        document.removeEventListener('pointercancel', onAlienPointerUp, true);
        alienUserPulling = false;
        alienUserTarget = null;
    }

    function startAlienInvasion() {
        if (alienActive) return;
        if (alienCleanupTimer) { clearTimeout(alienCleanupTimer); alienCleanupTimer = null; }
        for (var ci = 0; ci < alienShips.length; ci++) {
            if (alienShips[ci].el.parentNode) alienShips[ci].el.remove();
        }
        if (alienCanvas) { alienCanvas.remove(); alienCanvas = null; alienCtx = null; }
        alienActive = true;
        alienShips = [];
        alienBolts = [];
        alienBombs = [];

        alienCanvas = document.createElement('canvas');
        alienCanvas.className = 'alien-fx-canvas';
        alienCanvas.width = window.innerWidth;
        alienCanvas.height = window.innerHeight;
        alienCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9990;';
        document.body.appendChild(alienCanvas);
        alienCtx = alienCanvas.getContext('2d');

        bindAlienPointer();
        spawnAlienShip();

        alienSpawnTimer = setInterval(function() {
            if (alienShips.length < ALIEN_MAX_SHIPS) spawnAlienShip();
        }, ALIEN_SPAWN_INT);

        alienTimer = setTimeout(function() {
            endAlienInvasion();
        }, ALIEN_EVENT_DUR);

        if (!enabled) {
            buildPseudoWalkers();
            if (!alienRafId) alienRafId = requestAnimationFrame(alienAnimLoop);
        }
    }

    function spawnAlienShip() {
        const side = Math.random();
        let sx, sy, vx, vy;
        if (side < 0.25) { sx = -ALIEN_SHIP_SIZE; sy = Math.random() * window.innerHeight * 0.4; vx = ALIEN_FLY_SPEED; vy = 0.5; }
        else if (side < 0.5) { sx = window.innerWidth + ALIEN_SHIP_SIZE; sy = Math.random() * window.innerHeight * 0.4; vx = -ALIEN_FLY_SPEED; vy = 0.5; }
        else if (side < 0.75) { sx = Math.random() * window.innerWidth; sy = -ALIEN_SHIP_SIZE; vx = (Math.random() - 0.5) * 2; vy = ALIEN_FLY_SPEED; }
        else { sx = Math.random() * window.innerWidth; sy = -ALIEN_SHIP_SIZE; vx = (Math.random() - 0.5) * 3; vy = 1.5; }

        const el = document.createElement('div');
        el.className = 'alien-ship';
        el.innerHTML = '<img src="src/alien.png" draggable="false">';
        document.body.appendChild(el);

        alienShips.push({
            el: el, x: sx, y: sy, vx: vx, vy: vy,
            state: 'flying', tick: 0,
            target: null, capturedBug: null,
            shakeTick: 0, laserAngle: 0,
            attackCooldown: 60 + Math.floor(Math.random() * 60),
            nextAttack: '',
            anchorX: 0, anchorY: 0,
            armExtend: 0, armAngle: Math.PI / 2,
            grabHoldDur: 0, grabTimer: 0,
            tugTautFrames: 0, tugShip: null, tugShipTautFrames: 0,
            spinAngle: 0, spinSpeed: 0,
            windupTick: 0, throwDirX: 0, throwDirY: 0,
            gatlingShots: 0, gatlingTick: 0,
            bombCount: 0, bombTick: 0
        });
    }

    function endAlienInvasion() {
        alienActive = false;
        clearTimeout(alienTimer);
        clearInterval(alienSpawnTimer);

        for (var pi = 0; pi < alienPseudoWalkers.length; pi++) {
            var pw = alienPseudoWalkers[pi];
            if (pw.paused || pw.held) {
                pw.paused = false;
                pw.held = false;
                pw._alienGrabbedBy = null;
                pw.bug.element.style.display = '';
                pw.bug.element.style.opacity = '1';
                pw.bug.dx = pw._savedDx || (Math.random() - 0.5) * 5;
                pw.bug.dy = pw._savedDy || (Math.random() - 0.5) * 5;
            }
        }

        for (var i = 0; i < alienShips.length; i++) {
            var s = alienShips[i];
            if (s.target && s.target._alienGrabbedBy === s) s.target._alienGrabbedBy = null;
            if (s.target) { s.target.paused = false; s.target.held = false; }
            if (s.capturedBug) releaseBug(s, false);
            s.state = 'leaving';
            s.vy = -ALIEN_FLY_SPEED * 2;
            s.vx = (Math.random() - 0.5) * 3;
        }

        unbindAlienPointer();

        
        for (var bi = alienBombs.length - 1; bi >= 0; bi--) {
            if (alienBombs[bi].el) alienBombs[bi].el.remove();
        }

        alienCleanupTimer = setTimeout(function() {
            alienCleanupTimer = null;
            for (var i = 0; i < alienShips.length; i++) {
                if (alienShips[i].el.parentNode) alienShips[i].el.remove();
            }
            alienShips = [];
            alienBolts = [];
            alienBombs = [];
            if (alienCanvas) { alienCanvas.remove(); alienCanvas = null; alienCtx = null; }
        }, 2000);
    }

    function pickAlienTarget(ship) {
        var targets = getAlienTargetList();
        var best = null, bestDist = Infinity;
        for (var i = 0; i < targets.length; i++) {
            var w = targets[i];
            if (w.held || w.dropping) continue;
            if (w._alienGrabbedBy) continue;
            var taken = false;
            for (var j = 0; j < alienShips.length; j++) {
                if (alienShips[j] !== ship && alienShips[j].target === w && alienShips[j].state !== 'arm_hold') { taken = true; break; }
            }
            if (taken) continue;
            var dx = w.bug.x + w.size / 2 - ship.x;
            var dy = w.bug.y + w.size / 2 - ship.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) { bestDist = dist; best = w; }
        }
        return best;
    }

    function findTugTarget(ship) {
        for (var i = 0; i < alienShips.length; i++) {
            var s = alienShips[i];
            if (s === ship) continue;
            if (s.state === 'arm_hold' && s.target && !s.tugShip) return s;
        }
        return null;
    }

    function mutateBug(w) {
        var b = w.bug;
        var el = b.element;

        
        el.style.filter = '';
        el.style.clipPath = '';
        el.style.opacity = '';
        el.style.animation = '';

        
        var mutations = [
            
            function() {
                var shapes = [
                    'polygon(50% 0%, 0% 100%, 100% 100%)',
                    'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    'circle(50% at 50% 50%)',
                    'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                ];
                el.style.clipPath = shapes[Math.floor(Math.random() * shapes.length)];
            },
            
            function() {
                var hue = Math.floor(Math.random() * 360);
                el.style.filter = (el.style.filter || '') + ' hue-rotate(' + hue + 'deg) saturate(' + (2 + Math.random() * 3).toFixed(1) + ')';
            },
            
            function() {
                var tiny = Math.random() < 0.4;
                w.size = tiny ? Math.round(10 + Math.random() * 12) : Math.round(55 + Math.random() * 35);
                el.style.width = w.size + 'px';
                el.style.height = w.size + 'px';
                if (w._isBugSim) b.radius = w.size / 2;
                if (!w._isBugSim && w.legs) {
                    var lw = Math.round(w.size * 1.6);
                    var lh = Math.round(w.size * LEG_LENGTH + 8);
                    w.legs.canvas.width = lw;
                    w.legs.canvas.height = lh;
                    w.legs.canvas.style.width = lw + 'px';
                    w.legs.canvas.style.height = lh + 'px';
                    w.legs.w = lw;
                    w.legs.h = lh;
                }
            },
            
            function() {
                el.style.animation = 'alien-bounce 0.25s ease-in-out infinite alternate';
                w.speedMult = 1.5 + Math.random() * 2;
                if (w._isBugSim) { b.dx *= 1.5; b.dy *= 1.5; }
            },
            
            function() { addAlienAntennae(w); },
            
            function() {
                el.style.opacity = (0.35 + Math.random() * 0.25).toFixed(2);
                el.style.filter = (el.style.filter || '') + ' invert(1) brightness(' + (0.8 + Math.random() * 0.6).toFixed(1) + ')';
            },
            
            function() {
                w.speedMult = Math.random() < 0.5 ? 0.15 + Math.random() * 0.2 : 2.5 + Math.random() * 2;
            }
        ];

        
        var count = Math.random() < 0.5 ? 1 : 2;
        for (var i = mutations.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = mutations[i]; mutations[i] = mutations[j]; mutations[j] = tmp;
        }
        for (var m = 0; m < count; m++) { mutations[m](); }

        
        el.style.width = w.size + 'px';
        el.style.height = w.size + 'px';
        if (w._isBugSim) b.radius = w.size / 2;
    }

    function addAlienAntennae(w) {
        var el = w.bug.element;
        if (el.tagName === 'IMG') return;
        var old = el.querySelectorAll('.alien-antenna');
        old.forEach(function(a) { a.remove(); });
        for (var side = -1; side <= 1; side += 2) {
            var ant = document.createElement('div');
            ant.className = 'alien-antenna';
            ant.style.cssText = 'position:absolute;top:-12px;left:' + (side === -1 ? '20%' : '60%') + ';width:3px;height:14px;background:#2d2;border-radius:2px;transform:rotate(' + (side * 15) + 'deg);transform-origin:bottom center;pointer-events:none;z-index:1;';
            var tip = document.createElement('div');
            tip.style.cssText = 'position:absolute;top:-5px;left:-3px;width:9px;height:9px;background:#0f0;border-radius:50%;';
            ant.appendChild(tip);
            el.appendChild(ant);
        }
    }

    function releaseClawBug(ship) {
        var tw = ship.target;
        if (!tw) return;
        tw.paused = false;
        tw.held = false;
        tw._alienGrabbedBy = null;
        if (tw._isBugSim) {
            tw.bug.dx = tw._savedDx || (Math.random() - 0.5) * 5;
            tw.bug.dy = tw._savedDy || (Math.random() - 0.5) * 5;
        } else {
            tw.dropping = true;
            tw.dropFloor = Math.min(tw.bug.y + DROP_LAND_OFF, window.innerHeight - tw.size);
            tw.dropVelX = 0;
            tw.dropVelY = 2;
        }
        if (ship.tugShip) {
            ship.tugShip.tugShip = null;
            ship.tugShip.tugShipTautFrames = 0;
            ship.tugShip.holdDrift = null;
        }
        ship.tugShip = null;
        ship.tugTautFrames = 0;
        ship.tugShipTautFrames = 0;
        ship.holdDrift = null;
        ship.target = null;
        ship.state = 'flying';
        ship.tick = 0;
        ship.attackCooldown = 80;
    }

    function releaseBug(ship, mutate) {
        var w = ship.capturedBug;
        if (!w) return;
        var b = w.bug;
        b.element.style.display = '';
        b.element.style.opacity = '1';
        b.element.style.animation = '';
        if (w.legs) w.legs.canvas.style.display = '';
        if (mutate) mutateBug(w);
        
        b.x = ship.x - w.size / 2;
        b.y = ship.y + ALIEN_SHIP_SIZE;
        w.held = false;
        w.paused = false;
        w._alienGrabbedBy = null;

        if (w._isBugSim) {
            w.dropping = false;
            b.dx = (Math.random() - 0.5) * 8;
            b.dy = 6 + Math.random() * 6;
            b.element.style.transform = 'translate3d(' + b.x + 'px, ' + b.y + 'px, 0)';
        } else {
            w.dropping = true;
            w.dropFloor = Math.min(b.y + DROP_LAND_OFF, window.innerHeight - w.size);
            w.dropVelX = (Math.random() - 0.5) * 4;
            w.dropVelY = 3 + Math.random() * 3;
            b.element.style.transform = 'translate3d(' + b.x + 'px, ' + b.y + 'px, 0)';
        }
        ship.capturedBug = null;
    }

    
    function spawnAlienBolt(ship, angle) {
        alienBolts.push({
            x: ship.x,
            y: ship.y + ALIEN_SHIP_SIZE / 2,
            vx: Math.sin(angle) * GATLING_SPEED,
            vy: Math.cos(angle) * GATLING_SPEED,
            life: 120
        });
    }

    function updateAlienBolts(ctx, playW, playH) {
        var targets = getAlienTargetList();
        for (var i = alienBolts.length - 1; i >= 0; i--) {
            var bolt = alienBolts[i];
            bolt.x += bolt.vx;
            bolt.y += bolt.vy;
            bolt.life--;
            if (bolt.x < -50 || bolt.x > playW + 50 || bolt.y < -50 || bolt.y > playH + 50 || bolt.life <= 0) {
                alienBolts.splice(i, 1);
                continue;
            }
            var ang = Math.atan2(bolt.vy, bolt.vx);
            var tailX = bolt.x - Math.cos(ang) * GATLING_BOLT_LEN;
            var tailY = bolt.y - Math.sin(ang) * GATLING_BOLT_LEN;
            ctx.strokeStyle = 'rgba(255, 40, 40, 0.9)';
            ctx.lineWidth = GATLING_BOLT_R * 2;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(bolt.x, bolt.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255, 120, 120, 0.3)';
            ctx.lineWidth = GATLING_BOLT_R * 5;
            ctx.beginPath();
            ctx.moveTo(bolt.x, bolt.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
            
            var hit = false;
            for (var j = 0; j < targets.length; j++) {
                var w = targets[j];
                if (w.held || w.dropping) continue;
                var cx = w.bug.x + w.size / 2;
                var cy = w.bug.y + w.size / 2;
                var hdx = cx - bolt.x;
                var hdy = cy - bolt.y;
                if (hdx * hdx + hdy * hdy < (w.size / 2 + GATLING_BOLT_R * 2) * (w.size / 2 + GATLING_BOLT_R * 2)) {
                    if (w._isBugSim) {
                        w.bug.dx += (bolt.vx / GATLING_SPEED) * GATLING_KB;
                        w.bug.dy += (bolt.vy / GATLING_SPEED) * GATLING_KB;
                    } else {
                        w.bug.x += (bolt.vx / GATLING_SPEED) * GATLING_KB;
                        w.bug.y += (bolt.vy / GATLING_SPEED) * GATLING_KB;
                        w.bug.x = Math.max(0, Math.min(playW - w.size, w.bug.x));
                        w.bug.y = Math.max(0, Math.min(playH - w.size, w.bug.y));
                        w.beh = null;
                        w.paused = false;
                        w.dir = randDir();
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) { alienBolts.splice(i, 1); }
        }
    }

    
    function spawnAlienBomb(ship) {
        var s = BOMB_SCALE;
        var meteor = document.createElement('div');
        meteor.className = 'meteor';
        meteor.style.position = 'fixed';
        meteor.style.zIndex = '9993';
        meteor.style.pointerEvents = 'none';
        var hs = Math.round(20 * s);
        var head = document.createElement('div');
        head.className = 'meteor-head';
        head.style.width = hs + 'px';
        head.style.height = hs + 'px';
        head.style.left = (-hs / 2) + 'px';
        head.style.top = (-hs / 2) + 'px';
        head.style.boxShadow = '0 0 ' + Math.round(14 * s) + 'px ' + Math.round(6 * s) + 'px rgba(255,150,30,.9), 0 0 ' + Math.round(30 * s) + 'px ' + Math.round(10 * s) + 'px rgba(255,80,0,.5)';
        meteor.appendChild(head);
        document.body.appendChild(meteor);

        var launchAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.7;
        
        var playW = window.innerWidth;
        var playH = window.innerHeight;
        var startY = ship.y - ALIEN_SHIP_SIZE / 4;
        var groundY = playH - 4;
        var dy = groundY - startY;
        var targetX = 80 + Math.random() * (playW - 160);
        var vy0 = Math.sin(launchAngle) * BOMB_LAUNCH_SPEED;
        var disc = vy0 * vy0 + 2 * BOMB_GRAVITY * dy;
        if (disc < 0) disc = 0;
        var t = (-vy0 + Math.sqrt(disc)) / BOMB_GRAVITY;
        var vx0 = t > 0 ? (targetX - ship.x) / t : 0;
        var speed = Math.sqrt(vx0 * vx0 + vy0 * vy0);
        if (speed > BOMB_LAUNCH_SPEED * 1.8) {
            var sc = BOMB_LAUNCH_SPEED * 1.8 / speed;
            vx0 *= sc;
            vy0 *= sc;
        }
        alienBombs.push({
            el: meteor,
            x: ship.x,
            y: startY,
            vx: vx0,
            vy: vy0,
            scale: s,
            trail: []
        });
    }

    var BOMB_TRAIL_LEN = 18;

    function updateAlienBombs(playW, playH) {
        var targets = getAlienTargetList();
        for (var i = alienBombs.length - 1; i >= 0; i--) {
            var bomb = alienBombs[i];
            bomb.vy += BOMB_GRAVITY;
            bomb.x += bomb.vx;
            bomb.y += bomb.vy;

            
            bomb.trail.push({ x: bomb.x, y: bomb.y });
            if (bomb.trail.length > BOMB_TRAIL_LEN) bomb.trail.shift();

            
            if (bomb.trail.length > 1 && alienCtx) {
                for (var ti = 1; ti < bomb.trail.length; ti++) {
                    var alpha = (ti / bomb.trail.length) * 0.7;
                    var width = (ti / bomb.trail.length) * 6 * bomb.scale;
                    alienCtx.strokeStyle = 'rgba(255, 120, 30, ' + alpha + ')';
                    alienCtx.lineWidth = width;
                    alienCtx.lineCap = 'round';
                    alienCtx.beginPath();
                    alienCtx.moveTo(bomb.trail[ti - 1].x, bomb.trail[ti - 1].y);
                    alienCtx.lineTo(bomb.trail[ti].x, bomb.trail[ti].y);
                    alienCtx.stroke();
                }
                
                if (bomb.trail.length > 2) {
                    alienCtx.strokeStyle = 'rgba(255, 200, 50, 0.15)';
                    alienCtx.lineWidth = 12 * bomb.scale;
                    alienCtx.lineCap = 'round';
                    alienCtx.lineJoin = 'round';
                    alienCtx.beginPath();
                    alienCtx.moveTo(bomb.trail[0].x, bomb.trail[0].y);
                    for (var gi = 1; gi < bomb.trail.length; gi++) {
                        alienCtx.lineTo(bomb.trail[gi].x, bomb.trail[gi].y);
                    }
                    alienCtx.stroke();
                }
            }

            var ang = Math.atan2(bomb.vy, bomb.vx);
            var deg = (ang * 180 / Math.PI) - 90;
            bomb.el.style.transform = 'rotate(' + deg + 'deg)';
            bomb.el.style.left = bomb.x + 'px';
            bomb.el.style.top = bomb.y + 'px';
            bomb.el.style.opacity = Math.min(1, 0.4 + Math.abs(bomb.vy) * 0.1);
            if (bomb.y >= playH - 4 || bomb.x < -100 || bomb.x > playW + 100) {
                bomb.el.remove();
                if (bomb.y >= playH - 4) {
                    spawnBombExplosion(bomb.x, playH - 4, bomb.scale);
                    launchBugsFromBomb(bomb.x, playH - 4, bomb.scale, targets);
                    triggerScreenShake(8 * bomb.scale);
                }
                alienBombs.splice(i, 1);
            }
        }
    }

    function triggerScreenShake(intensity) {
        var shakeStart = performance.now();
        var dur = 300;
        var container = document.querySelector('.bugs-container') || document.body;
        function shake(now) {
            var elapsed = now - shakeStart;
            if (elapsed > dur) { container.style.transform = ''; return; }
            var decay = 1 - elapsed / dur;
            var dx = (Math.random() - 0.5) * intensity * decay * 2;
            var dy = (Math.random() - 0.5) * intensity * decay * 2;
            container.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            requestAnimationFrame(shake);
        }
        requestAnimationFrame(shake);
    }

    function spawnBombExplosion(x, y, scale) {
        var flash = document.createElement('div');
        flash.className = 'meteor-flash';
        flash.style.cssText = 'position:fixed;z-index:9994;pointer-events:none;';
        var fs = Math.round(60 * scale);
        flash.style.left = x + 'px';
        flash.style.top = y + 'px';
        flash.style.width = fs + 'px';
        flash.style.height = fs + 'px';
        document.body.appendChild(flash);
        setTimeout(function() { flash.remove(); }, 350);
        var ring = document.createElement('div');
        ring.className = 'meteor-blast-ring';
        ring.style.cssText = 'position:fixed;z-index:9994;pointer-events:none;';
        var rs = Math.round(24 * scale);
        ring.style.left = x + 'px';
        ring.style.top = y + 'px';
        ring.style.width = rs + 'px';
        ring.style.height = rs + 'px';
        ring.style.setProperty('--ring-expand', 9 * scale);
        ring.style.borderWidth = Math.max(2, Math.round(3 * scale)) + 'px';
        document.body.appendChild(ring);
        setTimeout(function() { ring.remove(); }, 600);
        var sparkN = Math.round(14 * scale);
        var sparkD = 80 * scale;
        for (var si = 0; si < sparkN; si++) {
            var p = document.createElement('div');
            p.className = 'meteor-spark';
            p.style.cssText = 'position:fixed;z-index:9994;pointer-events:none;';
            var sAngle = (Math.PI * 2 / sparkN) * si + (Math.random() - 0.5) * 0.6;
            var dist = (0.3 + Math.random() * 0.7) * sparkD;
            var sz = Math.max(3, Math.round(5 * scale));
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.width = sz + 'px';
            p.style.height = sz + 'px';
            p.style.setProperty('--sx', (Math.cos(sAngle) * dist) + 'px');
            p.style.setProperty('--sy', (Math.sin(sAngle) * dist) + 'px');
            p.style.animationDuration = (0.35 + scale * 0.25) + 's';
            document.body.appendChild(p);
            (function(el) { setTimeout(function() { el.remove(); }, 800); })(p);
        }
    }

    function launchBugsFromBomb(ix, iy, scale, targets) {
        for (var i = 0; i < targets.length; i++) {
            var w = targets[i];
            if (w.held) continue;
            var bx = w.bug.x + w.size / 2;
            var by = w.bug.y + w.size / 2;
            var ddx = bx - ix;
            var ddy = by - iy;
            var dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < BOMB_BLAST_R) {
                var angle = Math.atan2(ddy, ddx);
                var power = BOMB_LAUNCH_V * (1 - dist / BOMB_BLAST_R);
                if (w._isBugSim) {
                    w.bug.dx += Math.cos(angle) * power;
                    w.bug.dy += Math.sin(angle) * power - 10 * scale;
                } else {
                    w.bug.x += Math.cos(angle) * power * 0.5;
                    w.bug.y += Math.sin(angle) * power * 0.5;
                    w.beh = null;
                    w.paused = false;
                    w.dir = randDir();
                }
            }
        }
    }

    
    function updateAlienShips() {
        if (!alienActive && alienShips.length === 0 && alienBolts.length === 0 && alienBombs.length === 0) return;
        if (!alienCtx) return;

        var playW = window.innerWidth;
        var playH = window.innerHeight;
        if (alienCanvas.width !== playW || alienCanvas.height !== playH) {
            alienCanvas.width = playW;
            alienCanvas.height = playH;
        }
        alienCtx.clearRect(0, 0, playW, playH);

        updateAlienBolts(alienCtx, playW, playH);
        updateAlienBombs(playW, playH);

        for (var i = alienShips.length - 1; i >= 0; i--) {
            var ship = alienShips[i];
            ship.tick++;

            switch (ship.state) {

            
            case 'flying': {
                ship.x += ship.vx;
                ship.y += ship.vy;
                if (ship.x < 50) ship.vx += 0.1;
                if (ship.x > playW - 50) ship.vx -= 0.1;
                if (ship.y < 20) ship.vy += 0.1;
                if (ship.y > playH * 0.45) ship.vy -= 0.1;
                ship.vx += (Math.random() - 0.5) * 0.15;
                ship.vy += (Math.random() - 0.5) * 0.1;
                ship.vx = Math.max(-3, Math.min(3, ship.vx));
                ship.vy = Math.max(-2, Math.min(2, ship.vy));

                ship.attackCooldown--;
                if (ship.attackCooldown <= 0) {
                    
                    if (Math.random() < TUG_WAR_CHANCE * 60) {
                        var tugHost = findTugTarget(ship);
                        if (tugHost) {
                            ship.target = tugHost.target;
                            ship.nextAttack = 'arm_tug';
                            ship.state = 'approach';
                            ship.tick = 0;
                            var ttx = ship.target.bug.x + ship.target.size / 2;
                            var tty = ship.target.bug.y + ship.target.size / 2;
                            ship.anchorX = ttx + (ttx - tugHost.x) * 0.5;
                            ship.anchorY = tty - ALIEN_SHIP_SIZE * 1.5;
                            ship.attackCooldown = 999;
                            break;
                        }
                    }

                    var target = pickAlienTarget(ship);
                    if (target) {
                        ship.target = target;
                        var tx = target.bug.x + target.size / 2;
                        var ty = target.bug.y + target.size / 2;
                        var roll = Math.random();
                        if (roll < 0.20) {
                            ship.nextAttack = 'beam';
                            ship.anchorX = tx;
                            ship.anchorY = ty - ALIEN_SHIP_SIZE * 2;
                        } else if (roll < 0.45) {
                            ship.nextAttack = 'arm_extend';
                            ship.anchorX = tx;
                            ship.anchorY = ty - ALIEN_SHIP_SIZE * 1.2;
                        } else if (roll < 0.60) {
                            ship.nextAttack = 'laser';
                            ship.anchorX = ship.x;
                            ship.anchorY = Math.min(ship.y, playH * 0.3);
                        } else if (roll < 0.80) {
                            ship.nextAttack = 'gatling';
                            ship.anchorX = ship.x;
                            ship.anchorY = Math.min(ship.y, playH * 0.35);
                        } else {
                            ship.nextAttack = 'bomb';
                            ship.anchorX = ship.x;
                            ship.anchorY = Math.min(ship.y, playH * 0.25);
                        }
                        ship.state = 'approach';
                        ship.tick = 0;
                    }
                    ship.attackCooldown = 80 + Math.floor(Math.random() * 80);
                }
                break;
            }

            
            case 'approach': {
                var adx = ship.anchorX - ship.x;
                var ady = ship.anchorY - ship.y;
                var adist = Math.sqrt(adx * adx + ady * ady);
                if (adist > 15) {
                    ship.x += adx * 0.08;
                    ship.y += ady * 0.08;
                } else {
                    ship.x = ship.anchorX;
                    ship.y = ship.anchorY;
                    ship.vx = 0;
                    ship.vy = 0;
                    ship.state = ship.nextAttack;
                    ship.tick = 0;
                    ship.armExtend = 0;
                    ship.grabTimer = 0;
                    ship.grabHoldDur = GRAB_HOLD_MIN + Math.floor(Math.random() * (GRAB_HOLD_MAX - GRAB_HOLD_MIN));
                    ship.tugTautFrames = 0;
                    ship.spinAngle = 0;
                    ship.spinSpeed = 0;
                    ship.windupTick = 0;
                    ship.gatlingShots = 0;
                    ship.gatlingTick = 0;
                    ship.bombCount = 0;
                    ship.bombTick = 0;
                }
                if (ship.tick > ATTACK_TIMEOUT) {
                    if (ship.target) ship.target.paused = false;
                    ship.target = null;
                    ship.state = 'flying';
                    ship.tick = 0;
                }
                break;
            }

            
            case 'beam': {
                if (!ship.target || ship.target.held) { ship.state = 'flying'; ship.tick = 0; break; }
                var tw = ship.target;
                var tx = tw.bug.x + tw.size / 2;
                var ty = tw.bug.y + tw.size / 2;

                var beamX = ship.x;
                var beamTopY = ship.y + ALIEN_SHIP_SIZE / 2;
                var beamBotY = ty;
                if (beamBotY > beamTopY + 10) {
                    var grad = alienCtx.createLinearGradient(beamX, beamTopY, beamX, beamBotY);
                    grad.addColorStop(0, 'rgba(0, 255, 100, 0.5)');
                    grad.addColorStop(1, 'rgba(0, 255, 100, 0.05)');
                    alienCtx.beginPath();
                    alienCtx.moveTo(beamX - 8, beamTopY);
                    alienCtx.lineTo(beamX - BEAM_WIDTH / 2, beamBotY);
                    alienCtx.lineTo(beamX + BEAM_WIDTH / 2, beamBotY);
                    alienCtx.lineTo(beamX + 8, beamTopY);
                    alienCtx.closePath();
                    alienCtx.fillStyle = grad;
                    alienCtx.fill();
                }

                var beamProgress = Math.min(1, ship.tick / 120);
                tw.bug.y -= beamProgress * BEAM_SUCK_SPEED;
                tw.bug.x += (ship.x - tw.size / 2 - tw.bug.x) * 0.06;
                if (!tw.paused && tw._isBugSim) {
                    tw._savedDx = tw.bug.dx;
                    tw._savedDy = tw.bug.dy;
                }
                tw.paused = true;
                tw.beh = null;
                if (tw._isBugSim) { tw.bug.dx = 0; tw.bug.dy = 0; }

                if (tw.bug.y + tw.size / 2 <= ship.y + ALIEN_SHIP_SIZE / 2) {
                    ship.capturedBug = tw;
                    tw.bug.element.style.display = 'none';
                    if (tw.legs) tw.legs.canvas.style.display = 'none';
                    tw.held = true;
                    ship.state = 'shaking';
                    ship.shakeTick = 0;
                    ship.target = null;
                }

                if (ship.tick > ATTACK_TIMEOUT) {
                    tw.paused = false;
                    if (tw._isBugSim) {
                        tw.bug.dx = tw._savedDx || (Math.random() - 0.5) * 5;
                        tw.bug.dy = tw._savedDy || (Math.random() - 0.5) * 5;
                    }
                    ship.target = null;
                    ship.state = 'flying';
                    ship.tick = 0;
                    ship.attackCooldown = 60;
                }
                break;
            }

            
            case 'shaking': {
                ship.shakeTick++;
                var shakeAmp = 4 * Math.sin(ship.shakeTick * 0.8);
                ship.el.style.transform = 'translateX(' + shakeAmp + 'px)';
                if (ship.shakeTick > 60) {
                    ship.el.style.transform = '';
                    ship.state = 'spitting';
                    ship.tick = 0;
                }
                break;
            }

            
            case 'spitting': {
                if (ship.capturedBug) releaseBug(ship, true);
                ship.state = 'flying';
                ship.tick = 0;
                ship.attackCooldown = 60;
                break;
            }

            
            case 'laser': {
                var laserStartX = ship.x;
                var laserStartY = ship.y + ALIEN_SHIP_SIZE / 2;
                ship.laserAngle += 0.04;
                var laserLen = playH;
                var laserEndX = laserStartX + Math.sin(ship.laserAngle) * laserLen * 0.5;
                var laserEndY = laserStartY + Math.cos(ship.laserAngle * 0.3) * laserLen;

                alienCtx.strokeStyle = 'rgba(255, 30, 30, 0.8)';
                alienCtx.lineWidth = LASER_WIDTH;
                alienCtx.shadowColor = '#f00';
                alienCtx.shadowBlur = 12;
                alienCtx.beginPath();
                alienCtx.moveTo(laserStartX, laserStartY);
                alienCtx.lineTo(laserEndX, laserEndY);
                alienCtx.stroke();
                alienCtx.shadowBlur = 0;
                alienCtx.strokeStyle = 'rgba(255, 150, 150, 0.3)';
                alienCtx.lineWidth = LASER_WIDTH * 4;
                alienCtx.beginPath();
                alienCtx.moveTo(laserStartX, laserStartY);
                alienCtx.lineTo(laserEndX, laserEndY);
                alienCtx.stroke();

                var laserTargets = getAlienTargetList();
                for (var j = 0; j < laserTargets.length; j++) {
                    var w = laserTargets[j];
                    if (w.held || w.dropping) continue;
                    var bx = w.bug.x + w.size / 2;
                    var by = w.bug.y + w.size / 2;
                    var ldx = laserEndX - laserStartX;
                    var ldy = laserEndY - laserStartY;
                    var len2 = ldx * ldx + ldy * ldy;
                    var t = Math.max(0, Math.min(1, ((bx - laserStartX) * ldx + (by - laserStartY) * ldy) / len2));
                    var projX = laserStartX + t * ldx;
                    var projY = laserStartY + t * ldy;
                    var ldist = Math.sqrt((bx - projX) * (bx - projX) + (by - projY) * (by - projY));
                    if (ldist < w.size / 2 + LASER_WIDTH * 2) {
                        var kbx = (bx - laserStartX);
                        var kby = (by - laserStartY);
                        var kd = Math.sqrt(kbx * kbx + kby * kby) || 1;
                        if (w._isBugSim) {
                            w.bug.dx += (kbx / kd) * 15;
                            w.bug.dy += (kby / kd) * 15;
                        } else {
                            w.bug.x += (kbx / kd) * 15;
                            w.bug.y += (kby / kd) * 15;
                            w.bug.x = Math.max(0, Math.min(playW - w.size, w.bug.x));
                            w.bug.y = Math.max(0, Math.min(playH - w.size, w.bug.y));
                            w.beh = null;
                            w.paused = false;
                            w.dir = randDir();
                        }
                    }
                }
                if (ship.tick > LASER_DUR) {
                    ship.state = 'flying';
                    ship.target = null;
                    ship.tick = 0;
                    ship.attackCooldown = 60;
                }
                break;
            }

            
            case 'gatling': {
                ship.gatlingTick++;
                if (ship.gatlingTick >= GATLING_INTERVAL && ship.gatlingShots < GATLING_BURST) {
                    ship.gatlingTick = 0;
                    ship.gatlingShots++;
                    var spread = (Math.random() - 0.5) * 0.35;
                    spawnAlienBolt(ship, spread);
                }
                if (ship.gatlingShots >= GATLING_BURST) {
                    ship.state = 'flying';
                    ship.target = null;
                    ship.tick = 0;
                    ship.attackCooldown = 80;
                }
                break;
            }

            
            case 'bomb': {
                ship.bombTick++;
                if (ship.bombTick >= BOMB_INTERVAL && ship.bombCount < BOMB_COUNT) {
                    ship.bombTick = 0;
                    ship.bombCount++;
                    spawnAlienBomb(ship);
                }
                if (ship.bombCount >= BOMB_COUNT && ship.bombTick > 10) {
                    ship.state = 'flying';
                    ship.target = null;
                    ship.tick = 0;
                    ship.attackCooldown = 100;
                }
                break;
            }

            
            case 'arm_extend': {
                if (!ship.target || ship.target.held) { ship.state = 'flying'; ship.tick = 0; break; }
                var tw = ship.target;
                var tx = tw.bug.x + tw.size / 2;
                var ty = tw.bug.y + tw.size / 2;
                var baseX = ship.x;
                var baseY = ship.y + ALIEN_SHIP_SIZE / 2;

                ship.armExtend = Math.min(1, ship.armExtend + 0.025);
                var totalLen = ARM_SEG_LEN * 3;
                var reach = ship.armExtend * totalLen;
                var angle = Math.atan2(ty - baseY, tx - baseX);

                drawMechanicalArm(alienCtx, baseX, baseY, angle, reach, false);

                var clawX = baseX + Math.cos(angle) * reach;
                var clawY = baseY + Math.sin(angle) * reach;
                var cdist = Math.sqrt((clawX - tx) * (clawX - tx) + (clawY - ty) * (clawY - ty));

                if (cdist < tw.size + CLAW_RADIUS || ship.armExtend >= 1) {
                    if (cdist < tw.size + CLAW_RADIUS) {
                        ship.state = 'arm_hold';
                        tw.paused = true;
                        tw.beh = null;
                        tw._alienGrabbedBy = ship;
                        if (tw._isBugSim) { tw._savedDx = tw.bug.dx; tw._savedDy = tw.bug.dy; tw.bug.dx = 0; tw.bug.dy = 0; }
                        ship.tick = 0;
                        ship.grabTimer = 0;
                    } else {
                        ship.state = 'flying';
                        ship.target = null;
                        ship.tick = 0;
                    }
                }
                if (ship.tick > ATTACK_TIMEOUT) {
                    ship.state = 'flying';
                    ship.target = null;
                    ship.tick = 0;
                }
                break;
            }

            
            case 'arm_tug': {
                if (!ship.target || !ship.target._alienGrabbedBy) {
                    ship.state = 'flying'; ship.tick = 0; break;
                }
                var tw = ship.target;
                var tx = tw.bug.x + tw.size / 2;
                var ty = tw.bug.y + tw.size / 2;
                var baseX = ship.x;
                var baseY = ship.y + ALIEN_SHIP_SIZE / 2;

                ship.armExtend = Math.min(1, ship.armExtend + 0.03);
                var reach = ship.armExtend * ARM_SEG_LEN * 3;
                var angle = Math.atan2(ty - baseY, tx - baseX);
                drawMechanicalArm(alienCtx, baseX, baseY, angle, reach, false);

                var clawX = baseX + Math.cos(angle) * reach;
                var clawY = baseY + Math.sin(angle) * reach;
                var cdist = Math.sqrt((clawX - tx) * (clawX - tx) + (clawY - ty) * (clawY - ty));

                if (cdist < tw.size + CLAW_RADIUS * 2) {
                    var hostShip = tw._alienGrabbedBy;
                    ship.tugShip = hostShip;
                    hostShip.tugShip = ship;
                    ship.state = 'arm_hold';
                    ship.tick = 0;
                    ship.grabTimer = 0;
                    ship.grabHoldDur = GRAB_HOLD_MAX;
                    ship.tugTautFrames = 0;
                    ship.tugShipTautFrames = 0;
                }
                if (ship.tick > ATTACK_TIMEOUT) {
                    ship.state = 'flying';
                    ship.target = null;
                    ship.tick = 0;
                }
                break;
            }

            
            case 'arm_hold': {
                if (!ship.target) { ship.state = 'flying'; ship.tick = 0; break; }
                var tw = ship.target;
                var maxReach = ARM_SEG_LEN * 3;

                
                if (!ship.holdDrift) {
                    
                    var behaviorRoll = Math.random();
                    ship.holdDrift = {
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 0.6,
                        
                        mode: behaviorRoll < 0.35 ? 'cruise' : behaviorRoll < 0.55 ? 'swing' : behaviorRoll < 0.75 ? 'showoff' : 'examine',
                        circleAngle: Math.random() * Math.PI * 2,
                        circleR: 60 + Math.random() * 80,
                        circleCX: ship.x,
                        circleCY: ship.y,
                        swingPhase: 0,
                        examinePhase: 0,
                        armPhase: 0,
                        elbowBends: [0, 0]
                    };
                }

                var hd = ship.holdDrift;

                if (hd.mode === 'cruise') {
                    
                    hd.vx += (Math.random() - 0.5) * 0.08;
                    hd.vy += (Math.random() - 0.5) * 0.06;
                    hd.vx = Math.max(-2, Math.min(2, hd.vx));
                    hd.vy = Math.max(-1.2, Math.min(1.2, hd.vy));
                    ship.x += hd.vx;
                    ship.y += hd.vy;
                } else if (hd.mode === 'showoff') {
                    
                    hd.circleAngle += 0.015;
                    ship.x += (hd.circleCX + Math.cos(hd.circleAngle) * hd.circleR - ship.x) * 0.04;
                    ship.y += (hd.circleCY + Math.sin(hd.circleAngle) * hd.circleR * 0.5 - ship.y) * 0.04;
                } else if (hd.mode === 'examine') {
                    
                    hd.examinePhase += 0.02;
                    ship.x += Math.sin(hd.examinePhase * 1.5) * 0.3;
                    ship.y += Math.cos(hd.examinePhase) * 0.2;
                } else {
                    
                    ship.x += Math.sin(ship.tick * 0.02) * 0.15;
                    ship.y += Math.cos(ship.tick * 0.03) * 0.1;
                }

                
                if (ship.x < 40) ship.x += 1.5;
                if (ship.x > playW - 40) ship.x -= 1.5;
                if (ship.y < 20) ship.y += 1;
                if (ship.y > playH * 0.45) ship.y -= 1;

                var baseX = ship.x;
                var baseY = ship.y + ALIEN_SHIP_SIZE / 2;
                var bugCX = tw.bug.x + tw.size / 2;
                var bugCY = tw.bug.y + tw.size / 2;

                
                var clawTargetX, clawTargetY;
                hd.armPhase += 0.03;
                if (hd.mode === 'examine') {
                    
                    var pullPush = (Math.sin(hd.examinePhase * 0.5) + 1) / 2;
                    var examDist = ARM_SEG_LEN * (0.8 + pullPush * 1.5);
                    var examTilt = Math.sin(hd.armPhase * 2) * ARM_SEG_LEN * (0.3 + pullPush * 0.5);
                    clawTargetX = baseX + examTilt;
                    clawTargetY = baseY + examDist;
                    hd.elbowBends = [
                        Math.sin(hd.armPhase * 2.2) * (0.3 + pullPush * 0.3),
                        -Math.cos(hd.armPhase * 1.5) * 0.5 * (1 - pullPush * 0.5)
                    ];
                } else if (hd.mode === 'swing') {
                    
                    hd.swingPhase += 0.055;
                    var swingX = Math.sin(hd.swingPhase) * ARM_SEG_LEN * 2.0;
                    swingX += Math.sin(hd.swingPhase * 2.5) * ARM_SEG_LEN * 0.35;
                    clawTargetX = baseX + swingX;
                    clawTargetY = baseY + ARM_SEG_LEN * 2.0 + Math.abs(Math.cos(hd.swingPhase)) * ARM_SEG_LEN * 0.4;
                    hd.elbowBends = [
                        Math.sin(hd.swingPhase + 0.8) * 0.6,
                        -Math.sin(hd.swingPhase * 1.3) * 0.5
                    ];
                } else if (hd.mode === 'showoff') {
                    
                    var fig8X = Math.sin(hd.armPhase) * ARM_SEG_LEN * 1.4;
                    var fig8Y = Math.sin(hd.armPhase * 2) * ARM_SEG_LEN * 0.7;
                    clawTargetX = baseX + fig8X;
                    clawTargetY = baseY + ARM_SEG_LEN * 1.8 + fig8Y;
                    hd.elbowBends = [
                        Math.sin(hd.armPhase * 1.5) * 0.5,
                        Math.cos(hd.armPhase + 1) * 0.45
                    ];
                } else {
                    
                    clawTargetX = baseX + Math.sin(hd.armPhase) * ARM_SEG_LEN * 0.8 + Math.sin(hd.armPhase * 2.3) * 8;
                    clawTargetY = baseY + ARM_SEG_LEN * 2.5 + Math.cos(hd.armPhase * 1.3) * 6;
                    hd.elbowBends = [
                        Math.sin(hd.armPhase * 1.4) * 0.4,
                        Math.cos(hd.armPhase * 0.9) * 0.3
                    ];
                }

                
                if (tw._isBugSim) {
                    tw.bug.dx += (clawTargetX - tw.size / 2 - tw.bug.x) * TUG_SHIP_PULL;
                    tw.bug.dy += (clawTargetY - tw.size / 2 - tw.bug.y) * TUG_SHIP_PULL;
                    tw.bug.dx *= 0.92;
                    tw.bug.dy *= 0.92;
                } else {
                    tw.bug.x += (clawTargetX - tw.size / 2 - tw.bug.x) * TUG_SHIP_PULL;
                    tw.bug.y += (clawTargetY - tw.size / 2 - tw.bug.y) * TUG_SHIP_PULL;
                }

                
                var userPulling = false;
                if (alienUserPulling && alienUserTarget === tw) {
                    userPulling = true;
                    if (tw._isBugSim) {
                        tw.bug.dx += (alienUserPX - tw.bug.x - tw.size / 2) * TUG_USER_PULL;
                        tw.bug.dy += (alienUserPY - tw.bug.y - tw.size / 2) * TUG_USER_PULL;
                    } else {
                        tw.bug.x += (alienUserPX - tw.bug.x - tw.size / 2) * TUG_USER_PULL;
                        tw.bug.y += (alienUserPY - tw.bug.y - tw.size / 2) * TUG_USER_PULL;
                    }
                }
                
                if (!tw._isBugSim && heldWalker === tw) {
                    userPulling = true;
                    tw.bug.x += (pointerX + holdOffsetX - tw.bug.x) * TUG_USER_PULL;
                    tw.bug.y += (pointerY + holdOffsetY - tw.bug.y) * TUG_USER_PULL;
                }

                
                if (ship.tugShip && ship.tugShip.state === 'arm_hold') {
                    var otherShip = ship.tugShip;
                    var otherBaseX = otherShip.x;
                    var otherBaseY = otherShip.y + ALIEN_SHIP_SIZE / 2;

                    
                    var otherClawX = otherBaseX;
                    var otherClawY = otherBaseY + ARM_SEG_LEN * 2.5;
                    if (tw._isBugSim) {
                        tw.bug.dx += (otherClawX - tw.size / 2 - tw.bug.x) * TUG_SHIP_PULL;
                        tw.bug.dy += (otherClawY - tw.size / 2 - tw.bug.y) * TUG_SHIP_PULL;
                    } else {
                        tw.bug.x += (otherClawX - tw.size / 2 - tw.bug.x) * TUG_SHIP_PULL;
                        tw.bug.y += (otherClawY - tw.size / 2 - tw.bug.y) * TUG_SHIP_PULL;
                    }

                    
                    var midX = (ship.x + otherShip.x) / 2;
                    var midY = (ship.y + otherShip.y) / 2;
                    var fleeForce = 1.2;
                    
                    var fleeDx = ship.x - midX;
                    var fleeDy = ship.y - midY;
                    var fleeDist = Math.sqrt(fleeDx * fleeDx + fleeDy * fleeDy) || 1;
                    ship.x += (fleeDx / fleeDist) * fleeForce;
                    ship.y += (fleeDy / fleeDist) * fleeForce * 0.4;
                    
                    var fleeDx2 = otherShip.x - midX;
                    var fleeDy2 = otherShip.y - midY;
                    var fleeDist2 = Math.sqrt(fleeDx2 * fleeDx2 + fleeDy2 * fleeDy2) || 1;
                    otherShip.x += (fleeDx2 / fleeDist2) * fleeForce;
                    otherShip.y += (fleeDy2 / fleeDist2) * fleeForce * 0.4;

                    
                    ship.x += (Math.random() - 0.5) * 0.8;
                    ship.y += (Math.random() - 0.5) * 0.4;
                    otherShip.x += (Math.random() - 0.5) * 0.8;
                    otherShip.y += (Math.random() - 0.5) * 0.4;

                    
                    ship.holdDrift = null;
                    otherShip.holdDrift = null;
                }

                tw.paused = true;

                
                bugCX = tw.bug.x + tw.size / 2;
                bugCY = tw.bug.y + tw.size / 2;
                var armDx = bugCX - baseX;
                var armDy = bugCY - baseY;
                var armDist = Math.sqrt(armDx * armDx + armDy * armDy);
                if (armDist > maxReach) {
                    var clampAngle = Math.atan2(armDy, armDx);
                    tw.bug.x = baseX + Math.cos(clampAngle) * maxReach - tw.size / 2;
                    tw.bug.y = baseY + Math.sin(clampAngle) * maxReach - tw.size / 2;
                    if (tw._isBugSim) {
                        var dot = tw.bug.dx * Math.cos(clampAngle) + tw.bug.dy * Math.sin(clampAngle);
                        if (dot > 0) {
                            tw.bug.dx -= dot * Math.cos(clampAngle);
                            tw.bug.dy -= dot * Math.sin(clampAngle);
                        }
                    }
                    armDist = maxReach;
                }

                
                
                if (userPulling && armDist >= maxReach * 0.9) {
                    var dragAngle = Math.atan2(bugCY - ship.y, bugCX - ship.x);
                    ship.x += Math.cos(dragAngle) * SHIP_BRACE_FORCE;
                    ship.y += Math.sin(dragAngle) * SHIP_BRACE_FORCE * 0.5;
                }

                
                bugCX = tw.bug.x + tw.size / 2;
                bugCY = tw.bug.y + tw.size / 2;
                var armAngle = Math.atan2(bugCY - baseY, bugCX - baseX);
                armDist = Math.sqrt((bugCX - baseX) * (bugCX - baseX) + (bugCY - baseY) * (bugCY - baseY));
                drawMechanicalArm(alienCtx, baseX, baseY, armAngle, Math.min(armDist, maxReach), true, hd.elbowBends);

                
                var tensionDx = bugCX - clawTargetX;
                var tensionDy = bugCY - clawTargetY;
                var tension = Math.sqrt(tensionDx * tensionDx + tensionDy * tensionDy);

                if (userPulling && armDist >= maxReach * 0.9) {
                    ship.tugTautFrames++;
                } else {
                    ship.tugTautFrames = Math.max(0, ship.tugTautFrames - 2);
                }
                if (ship.tugTautFrames >= TUG_TAUT_FRAMES) {
                    ship.holdDrift = null;
                    releaseClawBug(ship);
                    break;
                }

                
                if (ship.tugShip) {
                    if (!ship.tugShipTautFrames) ship.tugShipTautFrames = 0;
                    if (tension > TUG_MAX_DIST * 0.8) {
                        ship.tugShipTautFrames++;
                    } else {
                        ship.tugShipTautFrames = Math.max(0, ship.tugShipTautFrames - 1);
                    }
                    if (ship.tugShipTautFrames >= TUG_TAUT_FRAMES) {
                        if (Math.random() < 0.4) {
                            ship.holdDrift = null;
                            releaseClawBug(ship);
                        } else {
                            ship.tugShip.holdDrift = null;
                            releaseClawBug(ship.tugShip);
                        }
                        break;
                    }
                }

                ship.grabTimer++;
                if (ship.grabTimer >= ship.grabHoldDur && !ship.tugShip) {
                    ship.holdDrift = null;
                    ship.state = 'arm_spin';
                    ship.tick = 0;
                    ship.spinAngle = armAngle;
                    ship.spinSpeed = 0.02;
                }
                break;
            }

            
            case 'arm_spin': {
                if (!ship.target) { ship.state = 'flying'; ship.tick = 0; break; }
                var tw = ship.target;
                var baseX = ship.x;
                var baseY = ship.y + ALIEN_SHIP_SIZE / 2;
                var orbitR = ARM_SEG_LEN * 2.5;

                
                if (!ship.throwStyle) {
                    ship.throwStyle = Math.random() < 0.5 ? 'swing_release' : 'stop_fling';
                }

                ship.spinSpeed = Math.min(SPIN_MAX, ship.spinSpeed + SPIN_ACCEL);
                ship.spinAngle += ship.spinSpeed;

                var orbX = baseX + Math.cos(ship.spinAngle) * orbitR - tw.size / 2;
                var orbY = baseY + Math.sin(ship.spinAngle) * orbitR - tw.size / 2;
                tw.bug.x = orbX;
                tw.bug.y = orbY;
                if (tw._isBugSim) { tw.bug.dx = 0; tw.bug.dy = 0; }

                var bugCX = tw.bug.x + tw.size / 2;
                var bugCY = tw.bug.y + tw.size / 2;
                var armAngle = Math.atan2(bugCY - baseY, bugCX - baseX);
                var armDist = Math.sqrt((bugCX - baseX) * (bugCX - baseX) + (bugCY - baseY) * (bugCY - baseY));
                drawMechanicalArm(alienCtx, baseX, baseY, armAngle, armDist, true);

                if (ship.spinSpeed >= SPIN_MAX && ship.tick > 60) {
                    if (ship.throwStyle === 'swing_release') {
                        
                        var tangentX = -Math.sin(ship.spinAngle);
                        var tangentY = Math.cos(ship.spinAngle);
                        tw.paused = false;
                        tw._alienGrabbedBy = null;
                        if (tw._isBugSim) {
                            tw.bug.dx = tangentX * THROW_FORCE;
                            tw.bug.dy = tangentY * THROW_FORCE;
                        } else {
                            tw.dropping = true;
                            tw.held = false;
                            tw.dropFloor = Math.min(tw.bug.y + DROP_LAND_OFF, window.innerHeight - tw.size);
                            tw.dropVelX = tangentX * THROW_FORCE;
                            tw.dropVelY = tangentY * THROW_FORCE;
                        }
                        if (ship.tugShip) {
                            ship.tugShip.tugShip = null;
                            ship.tugShip.tugShipTautFrames = 0;
                            if (ship.tugShip.target === tw) {
                                ship.tugShip.target = null;
                                ship.tugShip.state = 'flying';
                                ship.tugShip.tick = 0;
                            }
                        }
                        ship.tugShip = null;
                        ship.target = null;
                        ship.state = 'flying';
                        ship.tick = 0;
                        ship.attackCooldown = 80;
                        ship.throwStyle = null;
                    } else {
                        
                        ship.state = 'arm_throw';
                        ship.tick = 0;
                        ship.windupTick = 0;
                        
                        var aimAngle = Math.PI / 2 + (Math.random() - 0.5) * 1.2;
                        ship.throwDirX = Math.cos(aimAngle);
                        ship.throwDirY = Math.sin(aimAngle);
                    }
                }
                break;
            }

            
            case 'arm_throw': {
                if (!ship.target) { ship.state = 'flying'; ship.tick = 0; break; }
                var tw = ship.target;
                var baseX = ship.x;
                var baseY = ship.y + ALIEN_SHIP_SIZE / 2;

                ship.windupTick++;

                
                var aimPhase = Math.min(ship.windupTick / WINDUP_TICKS, 1);
                var windupR = ARM_SEG_LEN * (2.5 - aimPhase * 1.5);
                var wAngle = Math.atan2(ship.throwDirY, ship.throwDirX) + Math.PI;
                var aimX = baseX + Math.cos(wAngle) * windupR - tw.size / 2;
                var aimY = baseY + Math.sin(wAngle) * windupR - tw.size / 2;
                
                tw.bug.x += (aimX - tw.bug.x) * 0.15;
                tw.bug.y += (aimY - tw.bug.y) * 0.15;
                if (tw._isBugSim) { tw.bug.dx = 0; tw.bug.dy = 0; }

                var bugCX = tw.bug.x + tw.size / 2;
                var bugCY = tw.bug.y + tw.size / 2;
                var armAngle = Math.atan2(bugCY - baseY, bugCX - baseX);
                var armDist = Math.sqrt((bugCX - baseX) * (bugCX - baseX) + (bugCY - baseY) * (bugCY - baseY));
                drawMechanicalArm(alienCtx, baseX, baseY, armAngle, armDist, true);

                if (ship.windupTick > WINDUP_TICKS) {
                    tw.paused = false;
                    tw._alienGrabbedBy = null;
                    if (tw._isBugSim) {
                        tw.bug.dx = ship.throwDirX * THROW_FORCE;
                        tw.bug.dy = ship.throwDirY * THROW_FORCE;
                    } else {
                        tw.dropping = true;
                        tw.held = false;
                        tw.dropFloor = Math.min(tw.bug.y + DROP_LAND_OFF, window.innerHeight - tw.size);
                        tw.dropVelX = ship.throwDirX * THROW_FORCE;
                        tw.dropVelY = ship.throwDirY * THROW_FORCE;
                    }
                    if (ship.tugShip) {
                        ship.tugShip.tugShip = null;
                        ship.tugShip.tugShipTautFrames = 0;
                        if (ship.tugShip.target === tw) {
                            ship.tugShip.target = null;
                            ship.tugShip.state = 'flying';
                            ship.tugShip.tick = 0;
                        }
                    }
                    ship.tugShip = null;
                    ship.target = null;
                    ship.state = 'flying';
                    ship.tick = 0;
                    ship.attackCooldown = 80;
                    ship.throwStyle = null;
                }
                break;
            }

            
            case 'leaving': {
                ship.x += ship.vx;
                ship.y += ship.vy;
                ship.vy -= 0.05;
                if (ship.y < -ALIEN_SHIP_SIZE * 2) {
                    ship.el.remove();
                    alienShips.splice(i, 1);
                    continue;
                }
                break;
            }
            }

            
            ship.el.style.left = (ship.x - ALIEN_SHIP_SIZE / 2) + 'px';
            ship.el.style.top = (ship.y - ALIEN_SHIP_SIZE / 2) + 'px';
        }
    }

    function drawMechanicalArm(ctx, baseX, baseY, angle, totalReach, closed, elbowBends) {
        elbowBends = elbowBends || [0, 0];
        var segLen = totalReach / 3;

        
        var endX = baseX + Math.cos(angle) * totalReach;
        var endY = baseY + Math.sin(angle) * totalReach;

        
        var perpX = Math.cos(angle + Math.PI / 2);
        var perpY = Math.sin(angle + Math.PI / 2);

        
        var j1x = baseX + (endX - baseX) / 3 + perpX * elbowBends[0] * segLen;
        var j1y = baseY + (endY - baseY) / 3 + perpY * elbowBends[0] * segLen;
        var j2x = baseX + (endX - baseX) * 2 / 3 + perpX * elbowBends[1] * segLen;
        var j2y = baseY + (endY - baseY) * 2 / 3 + perpY * elbowBends[1] * segLen;

        
        var clawAngle = Math.atan2(endY - j2y, endX - j2x);

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(j1x, j1y);
        ctx.lineTo(j2x, j2y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.fillStyle = '#aaa';
        [{x: j1x, y: j1y}, {x: j2x, y: j2y}].forEach(function(j) {
            ctx.beginPath();
            ctx.arc(j.x, j.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        
        var clawX = endX;
        var clawY = endY;
        var pincerSpread = closed ? 0.0 : 0.45;
        var outerR = CLAW_RADIUS;
        var innerR = CLAW_RADIUS * 0.55;
        
        var ringCX = clawX + Math.cos(clawAngle) * outerR * 0.75;
        var ringCY = clawY + Math.sin(clawAngle) * outerR * 0.75;

        
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.arc(clawX, clawY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();

        
        
        
        var splitAngle = clawAngle + Math.PI / 2;
        for (var side = -1; side <= 1; side += 2) {
            
            var pivotOffset = side * pincerSpread;
            var startA = splitAngle + pivotOffset;
            var endA = startA + Math.PI;

            ctx.beginPath();
            
            ctx.arc(ringCX, ringCY, outerR, startA, endA, false);
            
            ctx.arc(ringCX, ringCY, innerR, endA, startA, true);
            ctx.closePath();
            ctx.fillStyle = '#aaa';
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    window.WalkMode = {
        enable:    enable,
        disable:   disable,
        toggle:    toggle,
        isEnabled: function () { return enabled; },
        toggleOcean: toggleOcean,
        startAlienInvasion: startAlienInvasion,
        
        onExternalSizeChange: function () {
            if (!enabled || !walkers) return;
            
            var bugData = window.BugSim && window.BugSim.getBugData();
            if (!bugData || bugData.length === 0) return;
            var currentBugW = parseInt(bugData[0].element.style.width) || (bugData[0].radius * 2);
            var newSmallSize = Math.round(currentBugW * WALK_SCALE);
            
            
            for (var i = 0; i < walkers.length; i++) {
                var w = walkers[i];
                if (!w.legs || !w.legs.canvas) continue;
                
                
                var oldOpacity = w.legs.canvas.style.opacity;
                var oldTransform = w.legs.canvas.style.transform;
                
                
                var newCanvasW = Math.round(newSmallSize * 1.6);
                var newCanvasH = Math.round(newSmallSize * LEG_LENGTH + 8);
                w.legs.canvas.width = newCanvasW;
                w.legs.canvas.height = newCanvasH;
                w.legs.canvas.style.width = newCanvasW + 'px';
                w.legs.canvas.style.height = newCanvasH + 'px';
                
                
                w.legs.w = newCanvasW;
                w.legs.h = newCanvasH;
                w.size = newSmallSize;
                
                
                positionLegs(w.legs, w.bug.x, w.bug.y, newSmallSize, w.swimRot);
            }
        }
    };
})();
