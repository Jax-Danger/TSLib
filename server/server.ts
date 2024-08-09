// Below are the events for the client side exports of the script:
onNet("Handcuff", (target: number) => {
  console.log("cuffing...", target);
  emitNet("Handcuff", target);
});

onNet("RemoveHandcuff", (target: number) => {
  console.log("removing cuffs...", target);
  emitNet("RemoveHandcuff", target);
});

onNet("Drag", (target: number, dragger: number) => {
  // Emit back to the target client with both IDs
  console.log("dragging...", target);
  emitNet("Drag", target, target, dragger);
});

onNet("Undrag", (target: number, dragger: number) => {
  // Emit back to the target client with both IDs
  console.log("undragging...", target);
  emitNet("Undrag", target, target, dragger);
});

onNet("ForceIntoVehicle", (target: number, index: number) => {
  console.log("Forcing into vehicle...", target);
  emitNet("ForceIntoVehicle", target, target, index);
});

onNet("ForceOutOfVehicle", (target: number, index: number) => {
  console.log("forcing out of vehicle...", target);
  emitNet("ForceOutOfVehicle", target, index);
});

onNet("ForceIntoVehicle", (target: number, index: number) => {
  console.log("Forcing into vehicle...", target);
  emitNet("ForceIntoVehicle", target, target, index);
});

onNet("ForceOutOfVehicle", (target: number, index: number) => {
  console.log("forcing out of vehicle...", target);
  emitNet("ForceOutOfVehicle", target, index);
});
