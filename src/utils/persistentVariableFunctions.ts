import { addValue, forgetValue, updateValue } from "../redux/gameActions";
import { getStore } from "../redux/storeRegistry";

export function store(propertyName: string, value: PersistentVariable, force = false) {
  getStore().dispatch(addValue(propertyName, value, force));
}

export function update(propertyName: string, value: PersistentVariable) {
  getStore().dispatch(updateValue(propertyName, value));
}

export function retrieve(propertyName: string) {
  return getStore().getState().customState[propertyName];
}

export function forget(propertyName: string) {
  getStore().dispatch(forgetValue(propertyName));
}
