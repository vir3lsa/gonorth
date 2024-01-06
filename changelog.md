# goNORTH Changelog

## Unreleased

## 1.5.0

* 2024-01-06 Updated existing verbs to use smart tests.
* 2023-12-30 Backwards-compatibly added SmartTest functionality to verbs.

## 1.4.0

* 2023-12-23 Fixed bug where player's free inventory space shrank after reloading the game.
* 2023-12-23 Parser registers possible verb from tokens rather than canonical verb name to negate misidentification.
* 2023-12-21 Changed VerbBuilder withTest method to accept varargs, and be additive on multiple calls.

## 1.3.0

* 2023-12-17 Ability to define how the narrator should refer to the player.
* 2023-12-17 Made feedback messages more helpful.
* 2023-12-10 Lowercased direction keywords.

## 1.2.1

* 2023-11-25 Stopped holdable doNotList items being listed in room descriptions.

## 1.2.0

* 2023-11-24 Added version information to title page and as a debug function.

## 1.1.0

* 2023-11-22 Added parser decision tree output when in debug mode.
* 2023-07-02 Fixed bug where first bullet point item didn't render correctly.

## 1.0.0

* 2023-03-20 Version 1.0.0 released.

## 1.0.0-rc5

* 2023-03-20 Fixed unit tests.

## 1.0.0-rc4

* 2023-03-20 Fixed event timeout overrides more.
* 2023-03-20 Resolved vulnerability.

## 1.0.0-rc3

* 2023-03-19 Fixed event timeout overrides.

## 1.0.0-rc2

* 2023-03-18 Added Cypress Cloud integration.
* 2023-03-18 Reinstate "withName" method in VerbBuilder.
* 2023-03-18 Fixed issue with ParserBar not responding to arrow keys.

## 1.0.0-rc1

* 2023-03-15 Finished converting source code to TypeScript.
* 2022-11-26 Converted various utility classes to TypeScript.
* 2022-11-25 Converted Text to TypeScript.
* 2022-11-25 First few files converted to TypeScript.
* 2022-10-30 Removed 'object' and 'helpers' from Verbs.
* 2022-10-30 Updated 'addEffect' and 'addWildcardEffect' functions to include 'continueVerb' parameters.
* 2022-11-13 Container.Builder now extends Item.Builder. 

## 0.7.1

* 2022-11-12 Ensured the item is passed to dynamic open and closed container description functions.

## 0.7.0

* 2022-11-09 Added ability to store serializable properties directly on items.

## 0.6.1

* 2022-11-04 Verbs always have an 'other' arg so effects can work with normally non-prepositional verbs.
* 2022-11-04 Added EventBuilder.
* 2022-10-30 Ensured items are auto-revealed when their container changes.
* 2022-10-29 Added placeholder subject headings to README.md.

## 0.6.0

* 2022-10-25 Added 'combine' verb to Item.
* 2022-10-23 Fixed dependency vulnerability.
* 2022-10-23 Added 'expectsArgs' function to VerbBuilder.

## 0.5.0

* 2022-10-21 Items may be given custom take success text.
* 2022-10-18 Effects now trigger after auto-actions and the verb may optionally continue.
* 2022-10-18 Made getItem function case-insensitive.

## 0.4.1

* 2022-10-11 Disabled Cypress video.
* 2022-10-10 Allowed items to be taken when they have no container.
* 2022-10-08 Allowed containers to be given keys by name.

# 0.4.0

* 2022-10-07 Made containers unlockable with or without keys.
* 2022-10-03 Added 'withArticle' function to ItemBulder.
* 2022-10-02 Added 'withOpenText' and 'withCloseText' functions to ContainerBuilder.
* 2022-10-02 Added feedback component integration tests.

## 0.3.0

* 2022-09-28 Made 'selectEffects' selector available externally.
* 2022-09-28 Added default message when trying to go through a closed door.

## 0.2.0

* 2022-09-25 Exported 'getItem' and 'selectOptionGraph' functions.

## 0.1.4

* 2022-09-24 Added verb shortcuts to Door.
* 2022-09-22 Removed ability to spawn non-existent items.
* 2022-09-17 Added 'add' alias to 'put' verb.

## 0.1.3

* 2022-09-17 Added 'withPreposition' function to Item.Builder.
* 2022-09-17 Fixed defect where auto actions were lost on erasing a saved game and starting a new one.

## 0.1.2

* 2022-09-15 Altered Github workflow to only create a package on release.
* 2022-09-15 Made random numbers seedable.
* 2022-09-15 Improved auto-generation of Cypress commands for h2 output.

## 0.1.1

* 2022-09-13 Added ability to go to room using its name instead of just the object.

## 0.1.0

* 2022-09-11 Removed Witch's Grotto example, replaced it with The White Room.

## 0.0.1

* 2022-09-03 Everything so far
