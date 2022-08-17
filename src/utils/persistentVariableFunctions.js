import { addValue, forgetValue, updateValue } from "../redux/gameActions";
import { getStore } from "../redux/storeRegistry";

export function store(propertyName, value, force = false) {
  getStore().dispatch(addValue(propertyName, value, force));
}

export function update(propertyName, value) {
  getStore().dispatch(updateValue(propertyName, value));
}

export function retrieve(propertyName) {
  return getStore().getState().customState[propertyName];
}

export function forget(propertyName) {
  getStore().dispatch(forgetValue(propertyName));
}
