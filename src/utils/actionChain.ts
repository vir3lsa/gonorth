import { changeInteraction, chainStarted, chainEnded } from "../redux/gameActions";
import { Interaction, Append } from "../game/interactions/interaction";
import { getStore } from "../redux/storeRegistry";
import { Text, SequentialText, ManagedText } from "../game/interactions/text";
import { OptionGraph } from "../game/interactions/optionGraph";
import { selectOptions } from "./selectors";
import { AnyAction } from "redux";

/*
 * Class representing a chainable action. Additional config can be set for the action.
 */
export class ActionClass {
  _action!: ActionFunction;
  renderNextButton: boolean;

  constructor(action: Action, renderNextButton: boolean) {
    this.action = action;
    this.renderNextButton = renderNextButton;
  }

  get action(): ActionFunction {
    return this._action;
  }

  set action(action: Action) {
    let actionFunction = action;

    if (typeof actionFunction !== "function") {
      actionFunction = () => action;
    }

    this._action = actionFunction;
  }
}

/*
 * Class representing a chain of actions. Actions can be in a variety of formats including strings, Texts, ActionChains, OptionGraphs
 * and arrays and functions that resolve to any of these. Any text produced by actions will be presented to the player and a 'Next'
 * button will usually be required to progress to the next action.
 */
export class ActionChain {
  _actions!: ChainableFunction[];
  _options?: OptionT | OptionT[];
  _postScript?: PostScript;
  renderNexts: boolean;
  propagateOptions: boolean;
  failed: boolean;
  lastActionProducedText: boolean;
  helpers: ActionChainHelpers;

  constructor(...actions: Action[]) {
    this.actions = actions;
    this.renderNexts = true;
    this.propagateOptions = false;
    this.postScript = undefined;
    this.failed = false;
    this.lastActionProducedText = false;
    this.helpers = {
      fail: () => (this.failed = true)
    };
  }

  set options(options) {
    this._options = options;
  }

  get options() {
    return this._options;
  }

  set postScript(postScript) {
    this._postScript = postScript;
  }

  get postScript() {
    return this._postScript;
  }

  addHelpers(helpers: ActionChainHelpers) {
    this.helpers = { ...this.helpers, ...helpers };
  }

  set actions(actions: Action[]) {
    this._actions = actions.map((action, i, actions) => this.toChainableFunction(action, i, actions.length));
  }

  /* Insert an action at the beginning of the chain. */
  insertAction(action: Action) {
    this._actions.unshift(this.toChainableFunction(action, 0, this._actions.length + 1));
  }

  insertActions(...actions: Action[]) {
    actions.reverse().forEach((action) => this.insertAction(action));
  }

  /* Add an action to the end of the chain. */
  addAction(action: Action) {
    this._actions.push(this.toChainableFunction(action, this._actions.length, this._actions.length + 1));
  }

  dispatchAppend(text: string, options: MaybeOptions, nextIfNoOptions = false, clearPage = false): Promise<any> {
    const interactionType = clearPage ? Interaction : Append;
    const optionsToShow = !nextIfNoOptions ? options : undefined;

    return getStore().dispatch(
      changeInteraction(
        new interactionType(text, optionsToShow, nextIfNoOptions, this.propagateOptions)
      ) as unknown as AnyAction // TODO
    ) as unknown as Promise<any>; // TODO
  }

  isActionClass(action: MaybeAction): action is ActionClassT {
    return Boolean(action) && action instanceof ActionClass;
  }

  toChainableFunction(action: Action, i: number, numActions: number): ChainableFunction {
    let actionFunction = typeof action === "function" ? action : () => action;
    const lastAction = i === numActions - 1;

    return (context?: ChainContext) => {
      const argsContext = { ...context };
      let value: MaybeAction = actionFunction(argsContext);
      let renderNextForThisAction = true;

      if (this.isActionClass(value)) {
        renderNextForThisAction = value.renderNextButton;
        value = value.action(argsContext);
      }

      // Render next buttons? Calculate here to ensure this.renderNexts is set
      const nextIfNoOptions = this.renderNexts && !lastAction && renderNextForThisAction;

      // Add a post-script?
      let postScript = "";

      if (lastAction && this.postScript) {
        postScript = `\n\n${this.getPostScript()}`;
      }

      // If this isn't the last action and new value is ActionChain with options
      if (!lastAction && value && (value as ActionChain).options) {
        throw Error("Custom options are only supported at the end of action chains.");
      }

      return this.handleValue(value, postScript, nextIfNoOptions, context, lastAction);
    };
  }

  handleValue(
    value: MaybeAction,
    postScript: string,
    nextIfNoOptions: boolean,
    context: MaybeChainContext,
    lastAction: boolean
  ): MaybePromise {
    if (
      lastAction &&
      ((typeof value === "string" && value) ||
        value instanceof Text ||
        (value instanceof Interaction && value.currentPage))
    ) {
      this.lastActionProducedText = true;
    }

    const argsContext = { ...context };

    if (value instanceof ActionChain) {
      return this.handleActionChain(value, context, nextIfNoOptions);
    } else if (typeof value === "string" && value) {
      return this.dispatchAppend(`${value}${postScript}`, this.options, nextIfNoOptions, false);
    } else if (Array.isArray(value)) {
      return this.handleActionChain(new ActionChain(...value), context, nextIfNoOptions);
    } else if (value instanceof SequentialText) {
      return this.expandSequentialText(value, this.options, nextIfNoOptions, postScript, argsContext);
    } else if (value instanceof Text || value instanceof ManagedText) {
      return this.dispatchAppend(`${value.next()}${postScript}`, this.options, nextIfNoOptions, (value as TextT).paged);
    } else if (value instanceof Interaction) {
      return getStore().dispatch(changeInteraction(value) as unknown as AnyAction) as unknown as MaybePromise; // TODO
    } else if (value instanceof OptionGraph) {
      return this.handleOptionGraph(value, context, nextIfNoOptions);
    } else if (typeof value === "function") {
      return this.handleValue(value(argsContext), postScript, nextIfNoOptions, context, lastAction);
    }

    // TODO Handle when value is ManagedText
    // This is an arbitrary action that shouldn't create a new interaction
    return value as undefined;
  }

  async handleActionChain(
    actionChain: ActionChain,
    context: MaybeChainContext,
    nextIfNoOptions: boolean,
    paged = false
  ) {
    await actionChain.chain({ ...context });
    if (nextIfNoOptions && actionChain.lastActionProducedText) {
      // If we're expecting to add options (e.g. Next) and there aren't current options (also e.g. Next), add them.
      return this.dispatchAppend(this.getPostScript() || "", this.options, nextIfNoOptions, paged);
    }
  }

  handleOptionGraph(optionGraph: OptionGraphT, context: MaybeChainContext, nextIfNoOptions: boolean) {
    return optionGraph
      .commence()
      .chain(context)
      .then(() => optionGraph.promise)
      .then(() => {
        if (nextIfNoOptions) {
          return this.dispatchAppend("", undefined, nextIfNoOptions);
        }
      });
  }

  getPostScript() {
    if (this.postScript instanceof Text) {
      return this.postScript.next();
    } else if (typeof this.postScript === "function") {
      return this.postScript();
    } else {
      return this.postScript;
    }
  }

  async expandSequentialText(
    sequentialText: SequentialText,
    options: MaybeOptions,
    nextIfNoOptions: boolean,
    postScript: PostScript,
    context: AnyContext
  ) {
    const numTexts = sequentialText.texts.length;
    let index = 0;

    while (index < numTexts) {
      const lastPage = index === numTexts - 1;
      const text = sequentialText.next(context);

      if (typeof text === "string") {
        await this.dispatchAppend(
          `${text}${lastPage ? postScript : ""}`,
          lastPage ? options : undefined,
          nextIfNoOptions || !lastPage,
          sequentialText.paged
        );
      }

      index++;
    }
  }

  async chain(context?: ChainContext) {
    // Ensure the ActionChain is ready to run.
    this.reset();

    let chainResolve: Resolve;
    let result = true;
    const chainPromise = new Promise((resolve) => (chainResolve = resolve));
    getStore().dispatch(chainStarted(chainPromise));
    const argsContext = { ...context, ...this.helpers };

    for (let i in this._actions) {
      const action = this._actions[i];

      // Run each action. If any return false, result becomes false.
      result = (await action(argsContext)) !== false && result;

      if (this.failed) {
        // Failing an action breaks the chain
        result = false;
        break;
      }
    }

    // Ensure the options have been added if intended.
    if (this.options && !selectOptions()) {
      await this.dispatchAppend("", this.options);
    }

    chainResolve!();
    getStore().dispatch(chainEnded(chainPromise));

    return result;
  }

  reset() {
    this.failed = false;
    this.lastActionProducedText = false;
  }
}
