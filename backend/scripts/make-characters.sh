#!/usr/bin/bash
# made for use by the backend
pushd ../character-maker
dotnet run -- generate
popd
