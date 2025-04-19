# goNORTH Changelog

# 15.0.2

- 2025-04-19 Fixed not scrolling back to top (from part way down) when command submitted in mobile mode.

# 15.0.1

- 2025-04-19 Move back-top-top button to the top in mobile mode, so it's not obscured behind the keyboard.

# 15.0.0

- 2025-04-19 Render output in reverse on smaller devices, with the input box at the top.
- 2025-04-18 Breaking change: removed default max-width and adjusted styling into overridable CSS classes.

# 14.4.0

- 2025-04-14 Added Object Discovery help page, and help page headings.
- 2025-04-13 Resolved issue with tables sometimes rendering incorrectly.
- 2025-04-12 moveItem function may maintain container listing, undefined persisted as null.

# 14.3.0

- 2025-04-08 OptionGraph Nodes may be marked as non-resumable so they're not recorded as the current node.

# 14.2.0

- 2025-04-05 Effects may have tests.
- 2025-04-05 Fixed bug where failed nested ActionChains didn't cause the outer chain to fail.

# 14.1.0

- 2025-03-29 Added the save keyword.

# 14.0.1

- 2025-03-29 Minor tweak to controls help page.

# 14.0.0

- 2025-03-16 Added help index and controls pages.
- 2025-03-16 The help pages are no longer automatically shown after the game's intro.
- 2025-03-13 Breaking change: renamed NodeBuilder.withOptions -> withOptionsObject and added varargs withOptions function.
- 2025-03-12 May add hint notes as builders or nodes.

# 13.1.0

- 2025-03-08 OptionGraphs may dynamically execute a function after they exit.
- 2025-03-08 Fixed bug where the start screen image didn't replace the previous room's image after a game over.

# 13.0.0

- 2025-02-22 Breaking change: Recurring Events and Schedules automatically restart their countdowns on completion.
- 2025-02-08 IODevice scrolls when events occur, but only if currently scrolled to the bottom.
- 2025-02-02 Breaking change: Events may have both time-based and turn-based countdowns, builder function names changed.

# 12.0.0

- 2025-01-26 Breaking change: throws an error when items are created outside of the intial setup function to prevent save game corruption.

# 11.0.0

- 2025-01-15 Breaking change: VerbBuilder.withSmartTest renamed to VerbBuilder.withTest.
- 2025-01-11 Breaking change: newVerb function removed, verb constructor accepts a VerbBuilder only, onSuccess and withOnFailure become onSuccess and onFailure.
- 2025-01-08 Added Husky for Prettier formatting on commit.
- 2025-01-08 Removed internal uses of the newVerb function in preparation for its future removal.
- 2025-01-04 Items may be revealed selectively.
- 2025-01-04 Item, Container, and Door actions (onOpen etc.) are all now varargs in their builders.

# 10.0.0

- 2024-12-31 Resolved defect where generic container descriptions were being ignored.
- 2024-12-28 Breaking change: Removed newItem, newContainer, and newDoor functions.
- 2024-12-27 Breaking change: takeSuccessText is now onTake and is an Action. Containers may be transparent, which should be used rather than itemsVisibleFromSelf.
- 2024-12-21 Breaking change: Renamed door actions for consistency.
- 2024-12-20 Breaking change: Various container texts are now Actions (and hence are not persisted in saved state).
- 2024-12-19 Containers no longer allow items to be added to them when they're closed.

# 9.1.0

- 2024-12-12 Added containerHasItem function, made playerHasItem and Item.removeItem functions more robust.
- 2024-12-10 Scroll panel fades out at the bottom to indicate there's more to scroll through.
- 2024-12-10 Very long lists are now displayed as tables.

# 9.0.0

- 2024-11-15 Breaking change: improved Gonorth's initialisation mechanism, docs are now built when a version is published.
- 2024-11-10 Added docs generation and first docs, including next, previous and okay functions in default export.

# 8.4.1

- 2024-11-08 OptionGraph resets the scene at the correct time.

# 8.4.0

- 2024-11-02 goToRoom function now accepts OptionGraph IDs.
- 2024-10-29 Fixed bug where omitted aliases were still recorded in the store, can also now omit room aliases.

# 8.3.0

- 2024-10-27 The GoNorth export now includes the clearPage function.

# 8.2.0

- 2024-10-26 Room direction onFailures may be Actions.
- 2024-10-26 Fixed bug where rooms with description functions did not cause a page change.

# 8.1.0

- 2024-10-20 Checkpoint function available on the default exported object.

# 8.0.0

- 2024-10-15 Fixed bug where triggered Events could carry over into new games.
- 2024-10-15 Breaking change: Events may only be constructed with Builders, Events may have additional trigger conditions, OptionsGraphs indicate when they're running.
- 2024-10-12 Keywords use builders, addKeyword accepts a builder, VerbBuilder has doNotList() method.

# 7.0.0

- 2024-10-11 Fixed bug where option buttons lost focus when the number of buttons shrank.
- 2024-10-02 Events and Schedules stored in save game state.
- 2024-09-24 Schedules may have conditions or be triggered manually. Schedules require IDs.
- 2024-09-24 Route extends Schedule and schedules are stored in Redux state.
- 2024-09-23 Schedule events may have their own conditions.
- 2024-09-22 Breaking change - ScheduleBuilder uses Events directly, event onComplete actions now varargs.

# 6.3.0

- 2024-09-10 Containers may define relinquish tests to dictate when items may be taken from them.
- 2024-09-08 Verb smart tests onFailure arguments are now varargs.
- 2024-09-07 Ensure we're exporting types.
- 2024-09-07 Made containerListing able to be dynamic.

# 6.2.1

- 2024-08-31 Fixed bug where door verbs didn't work.

# 6.2.0

- 2024-08-26 Non-hidden items may be added via the builders.

# 6.1.0

- 2024-08-24 NodeGraph Options may be built with a builder.
- 2024-08-23 Made 'withVerbs' method of ItemBuilder additive rather than destructive.
- 2024-08-22 Added 'withNode' method to OptionGraph NodeBuilder.
- 2024-08-21 Updated Prettier config to remove trailing commas.

# 6.0.0

- 2024-08-14 Breaking change - NPCs can only be constructed using a Builder.

# 5.0.0

- 2024-08-13 Breaking change - verb addAliases method uses varargs rather than an array.

# 4.0.0

- 2024-08-07 Breaking change - effects can take place before, instead of, or after the verb.
- 2024-08-06 Prepositional verbs work when the subject and object are reversed.
- 2024-08-04 Items can be made plural and 'isOrAre' function added.

## 3.5.0

- 2024-08-04 Can override default peek behaviour, doors can be transparent.
- 2024-08-03 Ability to peek through doors.

# 3.4.0

- 2024-08-02 Items that produce singular items trigger a 'take' action and then defer verbs to their children.
- 2024-07-31 Used correct item article in plural item smart test message.

## 3.3.0

- 2024-07-28 Renamed methods and properties for items producing singular items, added smart test.
- 2024-07-27 Items may produce another item e.g. when taking one from many.
- 2024-07-27 Items may be given parser precedence for auto-disambiguation.
- 2024-07-25 Item.addVerb and Item.Builder.withVerb accept Builders as well as verbs, for convenience.
- 2024-07-24 Item.addItem and Item.Builder.hidesItems accept Builders as well as items, for convenience.

## 3.2.0

- 2024-07-21 Door onCloseSuccess actions can be added via the builder.

## 3.1.0

- 2024-07-20 Doors can be made 'always open' to prevent verbs being added.
- 2024-07-08 Converted 'x' to 'examine' in parser feedback messages.

## 3.0.0

- 2024-07-06 Ability to omit aliases when building items, doors, containers and rooms. Rooms also create additional aliases, like items do.
- 2024-06-29 Added itemsVisibleFromSelf and itemsVisisbleFromRoom to ItemBuilder.

## 2.2.0

- 2024-06-15 Ability to add the reverse when adding a Traversal to a door.
- 2024-06-15 Fixed defect where focused option button would reset, another where focus didn't return to options.
- 2024-06-11 Fixed issue with incorrectly persisting and deserialising OptionGraphs not in initial state.
- 2024-06-08 Added withVerb method to VerbBuilder (to complement existing withVerbs method).

## 2.1.0

- 2024-06-01 Added Door onLocked and onNeedsKey overrides, added KeyBuilder, fixed tryUnlock issue.

## 2.0.0

- 2024-05-27 Replaced onDoorClosed and requiresOpen with withDoorOpenTest to give more control over test ordering.

## 1.17.1

- 2024-05-19 Removed requirement for dynamic description arrays to contain strings only.

## 1.17.0

- 2024-05-19 Door open and unlock success text may be an Action.
- 2024-05-16 Traversals may override door closed text or not require the door to be open.

## 1.16.0

- 2024-05-10 Traversals may have aliases.
- 2024-05-05 Add doors directly to Room directions and defer to their traversal verbs.
- 2024-05-04 Made traversal sub-verbs remote.

## 1.15.0

- 2024-04-29 Added go-through verb to Door and Traversals to DoorBuilder.
- 2024-04-20 Update GitHub action versions, resolve some vulnerable dependencies.

## 1.14.0

- 2024-04-20 Default-export functions on a gonorth object.

## 1.13.0

- 2024-04-20 Helper function to determine if player is in a room.
- 2024-04-01 Ability to customise verbs with Builders, DoorBuilder.

## 1.12.0

- 2024-03-23 Upgraded to Node 20, improved feedback box focus behaviour.
- 2024-03-22 Added "hide scene" and "reveal scene" keywords.
- 2024-03-20 Ability to scroll down by pressing enter.
- 2024-03-20 Improved auto-scroll behaviour, added scroll button.

## 1.11.0

- 2024-03-09 Added a config option for hiding the game title.

## 1.10.0

- 2024-02-24 OptionGraphs may be made non-resumable.
- 2024-02-23 OptionGraphs and the start screen may have images.
- 2024-02-21 Added scene toggle button, made game save immediately.
- 2024-02-20 Added location bar.
- 2024-02-19 Added Room Builder.
- 2024-02-10 Hints resume from where they left off, OptionGraphs may resume.

## 1.9.1

- 2024-01-29 Fixed Promise deadlock when action chains triggered events.

## 1.9.0

- 2024-01-28 Ability to abort action chains, drop verb is now optionally prepositional.
- 2024-01-27 Ability to reset Events and Schedules.

## 1.8.0

- 2024-01-24 Debug "move" function.
- 2024-01-13 Changed wording for placing items on the floor, added a drop verb.

## 1.7.0

- 2024-01-12 Ability to insert a new verb test at the start of the chain.

## 1.6.0

- 2024-01-07 Placed directional verbs on rooms, rather than being keywords, so they can be modified per room.

## 1.5.0

- 2024-01-06 Updated existing verbs to use smart tests.
- 2023-12-30 Backwards-compatibly added SmartTest functionality to verbs.

## 1.4.0

- 2023-12-23 Fixed bug where player's free inventory space shrank after reloading the game.
- 2023-12-23 Parser registers possible verb from tokens rather than canonical verb name to negate misidentification.
- 2023-12-21 Changed VerbBuilder withTest method to accept varargs, and be additive on multiple calls.

## 1.3.0

- 2023-12-17 Ability to define how the narrator should refer to the player.
- 2023-12-17 Made feedback messages more helpful.
- 2023-12-10 Lowercased direction keywords.

## 1.2.1

- 2023-11-25 Stopped holdable doNotList items being listed in room descriptions.

## 1.2.0

- 2023-11-24 Added version information to title page and as a debug function.

## 1.1.0

- 2023-11-22 Added parser decision tree output when in debug mode.
- 2023-07-02 Fixed bug where first bullet point item didn't render correctly.

## 1.0.0

- 2023-03-20 Version 1.0.0 released.

## 1.0.0-rc5

- 2023-03-20 Fixed unit tests.

## 1.0.0-rc4

- 2023-03-20 Fixed event timeout overrides more.
- 2023-03-20 Resolved vulnerability.

## 1.0.0-rc3

- 2023-03-19 Fixed event timeout overrides.

## 1.0.0-rc2

- 2023-03-18 Added Cypress Cloud integration.
- 2023-03-18 Reinstate "withName" method in VerbBuilder.
- 2023-03-18 Fixed issue with ParserBar not responding to arrow keys.

## 1.0.0-rc1

- 2023-03-15 Finished converting source code to TypeScript.
- 2022-11-26 Converted various utility classes to TypeScript.
- 2022-11-25 Converted Text to TypeScript.
- 2022-11-25 First few files converted to TypeScript.
- 2022-10-30 Removed 'object' and 'helpers' from Verbs.
- 2022-10-30 Updated 'addEffect' and 'addWildcardEffect' functions to include 'continueVerb' parameters.
- 2022-11-13 Container.Builder now extends Item.Builder.

## 0.7.1

- 2022-11-12 Ensured the item is passed to dynamic open and closed container description functions.

## 0.7.0

- 2022-11-09 Added ability to store serializable properties directly on items.

## 0.6.1

- 2022-11-04 Verbs always have an 'other' arg so effects can work with normally non-prepositional verbs.
- 2022-11-04 Added EventBuilder.
- 2022-10-30 Ensured items are auto-revealed when their container changes.
- 2022-10-29 Added placeholder subject headings to README.md.

## 0.6.0

- 2022-10-25 Added 'combine' verb to Item.
- 2022-10-23 Fixed dependency vulnerability.
- 2022-10-23 Added 'expectsArgs' function to VerbBuilder.

## 0.5.0

- 2022-10-21 Items may be given custom take success text.
- 2022-10-18 Effects now trigger after auto-actions and the verb may optionally continue.
- 2022-10-18 Made getItem function case-insensitive.

## 0.4.1

- 2022-10-11 Disabled Cypress video.
- 2022-10-10 Allowed items to be taken when they have no container.
- 2022-10-08 Allowed containers to be given keys by name.

# 0.4.0

- 2022-10-07 Made containers unlockable with or without keys.
- 2022-10-03 Added 'withArticle' function to ItemBulder.
- 2022-10-02 Added 'withOpenText' and 'withCloseText' functions to ContainerBuilder.
- 2022-10-02 Added feedback component integration tests.

## 0.3.0

- 2022-09-28 Made 'selectEffects' selector available externally.
- 2022-09-28 Added default message when trying to go through a closed door.

## 0.2.0

- 2022-09-25 Exported 'getItem' and 'selectOptionGraph' functions.

## 0.1.4

- 2022-09-24 Added verb shortcuts to Door.
- 2022-09-22 Removed ability to spawn non-existent items.
- 2022-09-17 Added 'add' alias to 'put' verb.

## 0.1.3

- 2022-09-17 Added 'withPreposition' function to Item.Builder.
- 2022-09-17 Fixed defect where auto actions were lost on erasing a saved game and starting a new one.

## 0.1.2

- 2022-09-15 Altered Github workflow to only create a package on release.
- 2022-09-15 Made random numbers seedable.
- 2022-09-15 Improved auto-generation of Cypress commands for h2 output.

## 0.1.1

- 2022-09-13 Added ability to go to room using its name instead of just the object.

## 0.1.0

- 2022-09-11 Removed Witch's Grotto example, replaced it with The White Room.

## 0.0.1

- 2022-09-03 Everything so far
