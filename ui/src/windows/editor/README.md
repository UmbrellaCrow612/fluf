# Editor

Represents the main editor that is shown fluf is opened - editor contains all the features for code edit's to work

 # Styles

 - Prefix each component with editor-
 - Use default angular components for each UI element instead of making our own
 - Each component css styles prefixed with it's name or part of the name like editor_frame_
- Use either public or private - if the variable is never read in UI or should not then use `private` else make it public and assume it can be used in UI
- Use angular `@` syntax for UI templates
- use pascal case
- Use signals for ever field that is read into UI saves render cycles