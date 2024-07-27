const Delay = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));
const TSLib = global.exports["TSLib"];

/* Below is a more optimized way to get a player's distance from a set of coordinates: 
Usage: global.exports['TSLib'].getDistance(coords1, coords2) */
global.exports(
  "getDistance",
  (coords1: number[], coords2: number[]): number => {
    const dx = coords1[0] - coords2[0];
    const dy = coords1[1] - coords2[1];
    const dz = coords1[2] - coords2[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    console.log(
      `getDistance: coords1=${coords1}, coords2=${coords2}, distance=${distance}`
    );
    return distance;
  }
);

/* Below is for getting the closest player to a set of coordinates:
 Usage: global.exports['TSLib'].getClosestPlayer(coords, maxDistance) */
function getClosestPlayer(coords: any, maxDistance: number) {
  const players = GetActivePlayers();
  let closestId: number = -1;
  let closestPed: any = null;
  let closestCoords: any = null;
  maxDistance = maxDistance || 2.0;
  const currentId = PlayerId();

  for (let i = 0; i < players.length; i++) {
    const playerId = players[i];
    if (playerId !== currentId) {
      const playerPed = GetPlayerPed(playerId);
      const playerCoords = GetEntityCoords(playerPed, true);
      const distance = TSLib.getDistance(coords, playerCoords);

      if (distance < maxDistance) {
        maxDistance = distance;
        closestId = playerId;
        closestPed = playerPed;
        closestCoords = playerCoords;
      }
    }
  }

  return { closestId, closestPed, closestCoords };
}

// Export the function using FiveM's global.exports system
global.exports("getClosestPlayer", getClosestPlayer);
/* Below is for loading an animation dictionary:
 Usage: global.exports['TSLib'].loadAnimDict(dict) */
global.exports("loadAnimDict", async (dict: string) => {
  RequestAnimDict(dict);
  while (!HasAnimDictLoaded(dict)) {
    await Delay(100);
  }
});

/* Below is for handcuffing a player:
 Usage: global.exports['TSLib].Handcuff() */
let handcuff = false; // Variable to keep track of handcuff status
global.exports("Handcuff", async () => {
  const playerCoords = GetEntityCoords(PlayerPedId(), true);
  const nearestPlayer = global.exports["MP-Police"].getClosestPlayer(
    playerCoords,
    2.0
  );
  const nearestPlayerId = nearestPlayer.closestId;

  if (nearestPlayerId !== -1) {
    const serverId = GetPlayerServerId(nearestPlayerId);
    emitNet("Handcuff", serverId); // Ensure this matches the server-side listener
  } else {
    console.log("No player found within the specified distance.");
  }
});
/* This event is part of the Handcuff export. 
This doesn't need to be added in your script in order to use the Handcuff export. */
onNet("Handcuff", async () => {
  const lPed = GetPlayerPed(-1);
  if (!handcuff) {
    await TSLib.loadAnimDict("mp_arresting");
    TaskPlayAnim(
      lPed,
      "mp_arresting",
      "idle",
      8.0,
      -8,
      -1,
      49,
      0,
      false,
      false,
      false
    );
    SetEnableHandcuffs(lPed, true);
    SetCurrentPedWeapon(lPed, GetHashKey("WEAPON_UNARMED"), true);
    handcuff = true; // This should be managed per player
  }
});

/* Below is for uncuffing a player:
 Usage: global.exports['TSLib'].RemoveHandcuffs() */
global.exports("RemoveHandcuffs", async () => {
  const playerCoords = GetEntityCoords(PlayerPedId(), true);
  const nearestPlayer = global.exports["MP-Police"].getClosestPlayer(
    playerCoords,
    2.0
  );
  const nearestPlayerId = nearestPlayer.closestId;

  if (nearestPlayerId !== -1) {
    const serverId = GetPlayerServerId(nearestPlayerId);
    emitNet("RemoveHandcuff", serverId); // Ensure this matches the server-side listener
  } else {
    console.log("No player found within the specified distance.");
  }
});
/* This event is part of the RemoveHandcuffs export. 
This doesn't need to be added in your script in order to use the RemoveHandcuffs export. */
onNet("RemoveHandcuff", async () => {
  const lPed = GetPlayerPed(-1);
  if (handcuff) {
    ClearPedSecondaryTask(lPed);
    SetEnableHandcuffs(lPed, false);
    SetCurrentPedWeapon(lPed, GetHashKey("WEAPON_UNARMED"), true);
    handcuff = false; // This should be managed per player
  }
});

let DraggedPlayer: number;
let draggedBy: number = -1;
let drag: boolean = false;

/* Below is for dragging a player:
 Usage: global.exports['TSLib'].DragPlayer() */
global.exports("DragPlayer", () => {
  console.log("dragging player");
  const playerCoords = GetEntityCoords(PlayerPedId(), true);
  const nearestPlayer = global.exports["MP-Police"].getClosestPlayer(
    playerCoords,
    2.0
  );
  const nearestPlayerId = nearestPlayer.closestId;

  if (nearestPlayerId !== -1) {
    const serverId = GetPlayerServerId(nearestPlayerId);
    DraggedPlayer = serverId;
    // Emit to server with both source (dragger) and target (draggee) IDs
    emitNet("Drag", serverId, GetPlayerServerId(PlayerId()));
  } else {
    console.log("No player found within the specified distance.");
  }
});
/* This event is part of the DragPlayer export.
This doesn't need to be added in your script in order to use the DragPlayer export. */
onNet("Drag", (target: number, dragger: number) => {
  const myServerId = GetPlayerServerId(PlayerId());
  // freeze target
  const lPed = GetPlayerPed(-1);

  if (target === myServerId) {
    draggedBy = dragger;
    drag = !drag;
    if (drag) {
      SetEnableHandcuffs(lPed, true);
    } else {
      SetEnableHandcuffs(lPed, false);
    }
  }
});
