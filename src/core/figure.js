// FIG: the figure API the editor uses. Every call is handed to the character's rig (cast.rig, default 'biped');
// rigs are plugins of type 'rig' (the built-in Person rig is src/core/rigs/biped.js). Shared parts (face, hair,
// clothes, accessories) live in parts.js.

const FIG = (() => {
  const rigOf = (cast) => CP.rigs[cast && cast.rig] || CP.rigs.biped;
  const R = (name) => (cast, ...a) => rigOf(cast)[name](cast, ...a);
  return {
    rigOf,
    rigs: () => Object.values(CP.rigs),
    dims: R('dims'), joints: R('joints'), prims: R('prims'), fromPreset: R('fromPreset'),
    handles: R('handles'), edit: R('edit'), flipBend: R('flipBend'),
    mirror: (cast, pose) => rigOf(cast).mirror(pose),
    bendOf: (cast, J, limb) => rigOf(cast).bendOf(cast, J, limb),
    limbs: (cast) => rigOf(cast).limbs,
    expressions: (cast) => rigOf(cast).expressions,
    posesFor: (cast) => CP.posesFor(rigOf(cast).id),
    accessoryFits: PARTS.fits, missingParts: PARTS.missingParts, sidedAccessories: PARTS.sidedAccessories, clothesDef: PARTS.clothesDef,
  };
})();
