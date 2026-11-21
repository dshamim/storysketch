// Core defaults. Poses, character templates and the starter cast are plugins now (plugins/poses, templates, characters).

// Every character starts from these values; character files / templates only list what differs.
const LOOK_DEFAULTS = {
  name: 'New character', color: '#2f6fd6', hairColor: '', clothesColor: '', build: 'child', height: 1, weight: 1,
  body: 'dress', hair: 'short', skirt: null, hatchBody: true, accessories: {}, hairFlip: false, capeFlip: false,
  faceTint: '', nose: true, defaultPose: 'stand', rig: 'biped',
};

