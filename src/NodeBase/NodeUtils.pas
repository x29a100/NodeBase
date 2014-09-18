unit NodeUtils;

interface

uses
  Windows, ImageHlp, Classes, SysUtils, StrUtils, Math, Dialogs, ExtCtrls,
  Messages;



function IntToStr4(Num: Integer): String;
function StrToInt4(Str: String): Integer;
function FloatToStr8(Num: Double): String;
function StrToFloat8(Str: String): Double;
function EncodeStr(Str: String; Position: Integer = 1): String;
function DecodeStr(Str: String): String;
function PosI(Index: Integer; Substr: String; S: String): Integer;
function NextIndex(Index: Integer; const Substr: array of string; S: String): Integer;
function GetFunctionList(const FileName: string; Strings: TStrings): Integer;
function GetProcAddress(Handle: Integer; FuncName: String): Integer;




function ToFileSystemName(var Indexes: array of String): String;
function LoadFromFile(FileName: String): String;
function SaveToFile(FileName: String; var Data: String): Integer;
function CreateDir(Indexes: array of String): String;


implementation




function GetProcAddress(Handle: Integer; FuncName: String): Integer;
begin
  Result := Integer(Windows.GetProcAddress(Handle, PChar(FuncName)));
end;

function StrToInt4(Str: String): Integer;
begin//optimize to asm
  Result := Ord(Str[1]) shl 24 + Ord(Str[2]) shl 16 +
            Ord(Str[3]) shl 8  + Ord(Str[4]);
end;

function IntToStr4(Num: Integer): String;
begin//optimize to asm
  Result := Chr((Num and $FF000000) shr 24) + Chr((Num and $00FF0000) shr 16) +
            Chr((Num and $0000FF00) shr 8)  + Chr((Num and $000000FF));
end;

function FloatToStr8(Num: Double): String;
var N: record
        case byte of
        1: (L, R: Integer);
        2: (X: Double);
        end;
begin//optimize to asm
  N.X := Num;
  Result := IntToStr4(N.L) + IntToStr4(N.R);
end;

function StrToFloat8(Str: String): Double;
var N: record
        case byte of
        1: (L, R: Integer);
        2: (X: Double);
        end;
begin//optimize to asm
  N.L := StrToInt4(Copy(Str, 1, 4));
  N.R := StrToInt4(Copy(Str, 5, 4));
  Result := N.X;
end;

function PosI(Index: Integer; Substr: String; S: String): Integer;
begin
  Delete(S, 1, Index);
  Result := Pos(Substr, S);
  if Result <> 0 then
    Inc(Result, Index)
  else
    Result := High(Integer);
end;

function NextIndex(Index: Integer; const Substr: array of string; S: String): Integer;
var
  I, PosIndex: Integer;
begin
  Result := High(Integer);
  for I := Low(Substr) to High(Substr) do
  begin
    PosIndex := PosI(Index, Substr[I], S);
    if PosIndex < Result then
      Result := PosIndex;
  end;
end;

function EncodeStr(Str: String; Position: Integer = 1): String;
var i: Integer;
begin
  Result := Copy(Str, 1, Position - 1);
  for i:=Position to Length(Str) do
    if Str[i] in [#48..#57, #65..#90, #97..#122]  //'@', '^', '.', '?', ':', '=', '&', ';', '#', '|'
    then Result := Result + Str[i]
    else Result := Result + '%' + IntToHex(Ord(Str[i]), 2);
end;

function DecodeStr(Str: String): String;
var
  i: integer;
  ESC: string[2];
  CharCode: integer;
begin
  Result := '';
  i := 1;
  while i <= Length(Str) do
  begin
    if Str[i] <> '%' then
      Result := Result + Str[i]
    else
    begin
      Inc(i);
      ESC := Copy(Str, i, 2);
      Inc(i, 1);
      CharCode := StrToIntDef('$' + ESC, -1);
      if (CharCode >= 0) and (CharCode <= 255) then
        Result := Result + Chr(CharCode);
    end;
    Inc(i);
  end;
end;


function EnumSymbols(SymbolName: PChar; SymbolAddress, SymbolSize: ULONG;
  Strings: Pointer): Bool; stdcall;
begin
  TStrings(Strings).Add(SymbolName);
  Result := True;
end;

function GetFunctionList(const FileName: string; Strings: TStrings): Integer;
var
  hProcess: THandle;
  VersionInfo: TOSVersionInfo;
begin
  Strings.Clear;
  Result := 0;
  SymSetOptions(SYMOPT_UNDNAME or SYMOPT_DEFERRED_LOADS);
  VersionInfo.dwOSVersionInfoSize := SizeOf(VersionInfo);
  if not GetVersionEx(VersionInfo) then Exit;
  if VersionInfo.dwPlatformId = VER_PLATFORM_WIN32_WINDOWS
  then hProcess := GetCurrentProcessId
  else hProcess := GetCurrentProcess;
  if not SymInitialize(hProcess, nil, True) then Exit;
  try
    Result := LoadLibrary(PChar(FileName));
    if Result = 0 then Exit;
    if not SymLoadModule(hProcess, 0, PChar(FileName), nil, Result, 0) then Exit;
      try if not SymEnumerateSymbols(hProcess, Result, EnumSymbols, Strings) then Exit;
      finally SymUnloadModule(hProcess, Result); end;
  finally SymCleanup(hProcess); end;
end;


//NodeUtils
function ToFileSystemName(var Indexes: array of String): String;
var          //c:\data\@\1\
  i, j: Integer;
  Index: String;
const
  IllegalCharacters = [#0..#32, '/', '\', ':', '*', '?', '@', '"', '<', '>', '|'];
  IllegalFileNames: array[0..0] of String = ('con') ;
begin
  Result := '';
  for i:=0 to High(Indexes) do
  begin
    Index := Indexes[i];
    if Length(Index) = 1 then
    begin
      if Index[1] in IllegalCharacters then
        Indexes[i] := IntToHex(Ord(Index[1]), 2);
    end
    else
    begin
      for j:=0 to High(IllegalFileNames) do
        if Index = IllegalFileNames[i] then
          Indexes[i] := Indexes[i] + '1';
    end;
    Result := Indexes[i] + '\' + Result;
  end;
end;


function CreateDir(Indexes: array of String): String;
var i: Integer;  //c:\data\@\1\
begin
  Result := '';
  for i:=High(Indexes) downto 0 do
  begin
    Result := Result + Indexes[i];
    SysUtils.CreateDir(Result);
    Result := Result + '\';
  end;
end;

function SaveToFile(FileName: String; var Data: String): Integer;
var OutFile: TextFile;
begin
  Result := 0;
  try
    AssignFile(OutFile, FileName);
    Rewrite(OutFile);
    WriteLn(OutFile, Data);
    CloseFile(OutFile);
  except
    on E: Exception do
      Result := 1;
  end;
end;

function LoadFromFile(FileName: String): String;
var
  InFile: TextFile;
  Buf: String;
begin
  Result := '';
  try
    AssignFile(InFile, FileName);
    Reset(InFile);
    while not Eof(InFile) do
    begin
      Readln(InFile, Buf);
      Result := Result + Buf + #10;
    end;
    CloseFile(InFile);
  except
    on E: Exception do
      Result := '';
  end;
end;


end.

