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
      `getDistance has returned coords1=${coords1}, coords2=${coords2}, distance=${distance}`
    );
    return distance;
  }
);

/* Below is for getting the closest player to a set of coordinates:
 Usage: global.exports['TSLib'].getClosestPlayer(coords, maxDistance) */
global.exports("getClosestPlayer", (coords: any, maxDistance: number) => {
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
});
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
  const nearestPlayer = global.exports["TSLib"].getClosestPlayer(
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
  const nearestPlayer = global.exports["TSLib"].getClosestPlayer(
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
  const nearestPlayer = global.exports["TSLib"].getClosestPlayer(
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
    console.log("There is no player nearby!");
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

exports("ForceIntoVehicle", () => {
  const playerPed = PlayerPedId();
  const plCoords = GetEntityCoords(playerPed, true);
  const nearestPlayer = exports["TSLib"].getClosestPlayer(plCoords, 2.0);
  const closestPlayer = nearestPlayer.closestId;
  console.log(closestPlayer, GetPlayerServerId(closestPlayer));
  if (closestPlayer <= 0) {
    return emit("MP-Elements:SendNotification", 2, "No player found", 500);
  }
  emitNet("ForceIntoVehicle", GetPlayerServerId(closestPlayer), closestPlayer);
});

onNet("ForceIntoVehicle", (target: number, index: number) => {
  console.log(1);
  // Assuming target is a player index, get the ped handle for the target player
  const targetPed = GetPlayerPed(index);
  const playerPed = PlayerPedId();
  const plCoords = GetEntityCoords(playerPed, true);
  const [x, y, z] = [plCoords[0], plCoords[1], plCoords[2]];
  const vehicle = GetClosestVehicle(x, y, z, 5, 0, 127); // Get the closest vehicle within 5 units
  console.log(vehicle);
  if (vehicle) {
    console.log(2);
    const vehicleCoords = GetEntityCoords(vehicle, true);
    const distance = GetDistanceBetweenCoords(
      plCoords[0],
      plCoords[1],
      plCoords[2],
      vehicleCoords[0],
      vehicleCoords[1],
      vehicleCoords[2],
      true
    );

    if (distance < 5) {
      console.log(targetPed);
      console.log(`Warping player ${target} into seat: 2`);
      // Use targetPed instead of target to correctly warp the ped into the vehicle
      TaskWarpPedIntoVehicle(targetPed, vehicle, 2);
    }
  } else {
    console.log("No vehicle available or no nearest player found.");
  }
});

exports("ForceOutOfVehicle", () => {
  const playerPed = PlayerPedId();
  const plCoords = GetEntityCoords(playerPed, true);
  const nearestPlayer = exports["TSLib"].getClosestPlayer(plCoords, 2.0);
  const closestPlayer = nearestPlayer.closestId;
  console.log(closestPlayer, GetPlayerServerId(closestPlayer));
  if (closestPlayer <= 0) {
    return emit("MP-Elements:SendNotification", 2, "No player found", 500);
  }
  emitNet("ForceOutOfVehicle", GetPlayerServerId(closestPlayer), closestPlayer);
});

onNet("ForceOutOfVehicle", (index: number) => {
  console.log("Attempting to remove player from vehicle");
  const playerPed = GetPlayerPed(index);
  const vehicle = GetVehiclePedIsIn(playerPed, true); // Get the vehicle the player is in, if any

  if (vehicle !== 0) {
    // Check if the player is in a vehicle by checking if vehicle is not 0
    console.log("Player is in a vehicle, attempting to remove...");
    setImmediate(() => {
      TaskLeaveAnyVehicle(playerPed, vehicle, 16); // Use the vehicle variable directly
    });
  } else {
    console.log("Player is not in a vehicle.");
  }
});
