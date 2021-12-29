
module.exports = function supersorc(mod) {
	
	//Variables
	let cid
	let myPosition
	let myAngle
	let enabled = true
	let isCD_prime = false
	let distance = 1000
	let dolance = false
	
	//IDs
	let arcane_grant_id = 41212
	let prime_id = 360200
	let fusion_id = 360600
	let arcane_press_id = 41200
	let fire_enab = 502020
	let ice_enab = 502040
	let arcane_enab = 502030
	let fusion_enab = 502050
	let urgency_id = 9100100
	let lances_id = 350100
	let implosion_id = 390100
	let stun_trap = 30300
	
	
	
	//Boss
	let bossid
	let bossloc
	let monsters = []
	let block_hit = false

	
	mod.command.add('sorc', () => {
		enabled = !enabled
		mod.command.message(`Salchy's sorc mod is now ${(enabled) ? 'en' : 'dis'}abled.`)
	})
	
	mod.hook('S_LOGIN', 14, (event) => {
		cid = event.gameId
	})
	
	mod.hook('S_SKILL_CATEGORY', 4, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		
	})
	
	mod.hook('S_START_COOLTIME_SKILL', 3, {order: -999999}, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		if(event.skill.id==prime_id) {
			isCD_prime = true
			/*mod.send('S_START_COOLTIME_SKILL', 3, {
				skill: {
					reserved: 0,
					npc: false,
					type: 1,
					huntingZoneId: 0,
					id: urgency_id
				},
				cooldown: event.cooldown
			})*/
			setTimeout(function () {
				isCD_prime = false
			}, event.cooldown)
			return false
		}
		
	})

	mod.hook('S_SPAWN_NPC', 12, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return		
		monsters.push({ gameId: event.gameId, loc: event.loc })
	})
	mod.hook('S_BOSS_GAGE_INFO', 3, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		if(bossid && bossid == event.id) return
		bossid = event.id
		mod.send("S_CUSTOM_STYLE_SYSTEM_MESSAGE", 1, {
			message: "Boss detected",
			style: 54
		})
		mod.send("S_PLAY_SOUND", 1, {
			SoundID: 2023
		})		
		let monster = monsters.find(m => m.gameId === event.id)
		if (monster) bossloc = monster.loc		
				
		
	})

	mod.hook('S_NPC_LOCATION', 3, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		let monster = monsters.find(m => m.gameId === event.gameId)
		if (monster) monster.loc = event.loc
		if(bossid == event.gameId) bossloc = event.loc		
	})
	mod.hook('S_DESPAWN_NPC', 3, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		monsters = monsters.filter(m => m.gameId != event.gameId)
		if(bossid == event.gameId) { 
			bossid = null
			bossloc = null
		}	
	})
	
	mod.hook('S_START_USER_PROJECTILE', 9, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		if(!bossid) return
		let targets = []		
			targets.push({
				gameId: bossid
			})			
		
		if(!targets[0]) {
			block_hit = false
			return
		} else {
			block_hit = true
			mod.send('S_START_USER_PROJECTILE', 9, event)
			mod.send('C_HIT_USER_PROJECTILE', 4, {
				id: event.id,
				end: event.end,
				loc: bossloc,
				targets: targets
			})			
			return false	
		}
	})

	mod.hook('C_HIT_USER_PROJECTILE', 4, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return		
		if(block_hit) return false
	})	

	mod.hook('S_ACTION_STAGE', 9, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		if(bossid == event.gameId) bossloc = event.loc
		if(event.gameId==mod.game.me.gameId && event.skill.id==arcane_press_id && event.stage==2) {
			mod.send('C_PRESS_SKILL', 4, {
				skill: {
					reserved: 0,
					npc: false,
					type: 1,
					huntingZoneId: 0,
					id: arcane_press_id
				},
				press: false,
				loc: myPosition,
				w: myAngle								
			})
		}		
	})		

	mod.hook('S_ACTION_END', 5, event => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return
		if(bossid == event.gameId) bossloc = event.loc
	})
	

	
	mod.hook('C_PLAYER_LOCATION', 5, (event) => {
		myPosition = event.loc
		myAngle = event.w
	})
	
	mod.hook('C_START_SKILL', 7, { order: -1000 }, (event) => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return		
		myPosition = event.loc
		myAngle = event.w
		if(event.skill.id===stun_trap) {
			if(!bossloc) {
				prime(distance,0)
				return false	
			} else {
				if(isCD_prime) {
					event.skill.id = fusion_id
				}
				if(!isCD_prime) {
					event.skill.id = prime_id
					event.dest = bossloc
				}				
				return true
			}				
		}
		let sInfo = getSkillInfo(event.skill.id)		
		switch(sInfo.group) {
			case 4:
				dolance = true
				break								
			case 30:
				dolance = true
				break
			case 33:
				dolance = true
				break
			default:
				return
				break					
		}
		if(dolance) {
			dolance = false
			lances(distance,0)
		}				
	})

	mod.hook('C_START_INSTANCE_SKILL', 7, (event) => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return		
		myPosition = event.loc
		myAngle = event.w
	})

	mod.hook('C_PRESS_SKILL', 4, { filter: { fake: false } }, (event) => {
		if(!enabled) return
		if(mod.game.me.class !== 'sorcerer') return		
		myPosition = event.loc
		myAngle = event.w
		if(event.skill.id==arcane_press_id && !event.press) {
			return false
		}
		
	})

    function getSkillInfo(id) {
		let nid = id;
        return {
            id: nid,
            group: Math.floor(nid / 10000),
            level: Math.floor(nid / 100) % 100,
            sub: nid % 100
        };
    }
	
	function prime(d, n) {
		CastPrime((Math.cos(myAngle) * d) + myPosition.x, (Math.sin(myAngle) * d) + myPosition.y, myPosition.z + n, myAngle);
	}
	
	function CastPrime(x, y, z, w = 0) {
		mod.send('C_START_SKILL', 7, {
			skill: {
				reserved: 0,
				npc: false,
				type: 1,
				huntingZoneId: 0,
				id: isCD_prime ? fusion_id : prime_id
			},
			w: myAngle,
			loc: myPosition,
			dest: {
				x: x,
				y: y,
				z: z
			},
			unk: true,
			moving: false,
			continue: false,
			target: 0,
			unk2: false						
		})		
	}

	function lances(d, n) {
		CastLances((Math.cos(myAngle) * d) + myPosition.x, (Math.sin(myAngle) * d) + myPosition.y, myPosition.z + n, myAngle);
	}
	
	function CastLances(x, y, z, w = 0) {
		mod.send('C_START_SKILL', 7, {
			skill: {
				reserved: 0,
				npc: false,
				type: 1,
				huntingZoneId: 0,
				id: lances_id
			},
			w: myAngle,
			loc: myPosition,
			dest: {
				x: x,
				y: y,
				z: z
			},
			unk: true,
			moving: false,
			continue: false,
			target: 0,
			unk2: false						
		})		
	}		
	
	
}
