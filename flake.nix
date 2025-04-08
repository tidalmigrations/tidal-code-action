{
  description = "Development environment for tidal-code-action";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system}; in
      {
        # Add dependencies that are only needed for development
        devShells = {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [ nodejs_22 git ];
          };
        };
      }
    );
}
